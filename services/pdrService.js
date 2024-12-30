const OpenAI = require('openai');

class PDRService {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }

        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        // Define the tools for PDR analysis
        this.tools = [
            {
                type: "function",
                function: {
                    name: "extract_medical_info",
                    description: "Extract key information from medical reports for permanent disability ratings",
                    strict: true,
                    parameters: {
                        type: "object",
                        required: [
                            "name",
                            "date_of_birth",
                            "occupation",
                            "date_of_injury",
                            "body_parts",
                            "medical_provider",
                            "claim_number"
                        ],
                        properties: {
                            name: {
                                type: "string",
                                description: "Patient's name"
                            },
                            date_of_birth: {
                                type: "string",
                                description: "Patient's date of birth"
                            },
                            occupation: {
                                type: "string",
                                description: "Patient's occupation"
                            },
                            date_of_injury: {
                                type: "string",
                                description: "Date of injury"
                            },
                            body_parts: {
                                type: "array",
                                items: {
                                    type: "object",
                                    required: [
                                        "part",
                                        "wpi_percentage",
                                        "apportionment"
                                    ],
                                    properties: {
                                        part: {
                                            type: "string",
                                            description: "Body part affected"
                                        },
                                        wpi_percentage: {
                                            type: "number",
                                            description: "Whole Person Impairment percentage"
                                        },
                                        apportionment: {
                                            type: "string",
                                            description: "Any apportionment mentioned"
                                        }
                                    },
                                    additionalProperties: false
                                }
                            },
                            medical_provider: {
                                type: "string",
                                description: "Name of medical provider"
                            },
                            claim_number: {
                                type: "string",
                                description: "Claim number"
                            }
                        },
                        additionalProperties: false
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "determine_occupation_group",
                    description: "Determine occupation group number and variant based on job duties",
                    strict: true,
                    parameters: {
                        type: "object",
                        required: [
                            "occupation",
                            "body_parts",
                            "group_number"
                        ],
                        properties: {
                            occupation: {
                                type: "string",
                                description: "Patient's occupation"
                            },
                            body_parts: {
                                type: "array",
                                description: "List of body parts affected along with their occupational variants",
                                items: {
                                    type: "object",
                                    required: [
                                        "part",
                                        "variant"
                                    ],
                                    properties: {
                                        part: {
                                            type: "string",
                                            description: "Body part affected"
                                        },
                                        variant: {
                                            type: "string",
                                            description: "Occupational variant code"
                                        }
                                    },
                                    additionalProperties: false
                                }
                            },
                            group_number: {
                                type: "string",
                                description: "Occupation group number"
                            }
                        },
                        additionalProperties: false
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "calculate_rating",
                    description: "Calculate permanent disability rating using standard formula",
                    strict: true,
                    parameters: {
                        type: "object",
                        required: [
                            "impairments",
                            "combined_rating",
                            "combination_steps"
                        ],
                        properties: {
                            impairments: {
                                type: "array",
                                items: {
                                    type: "object",
                                    required: [
                                        "code",
                                        "wpi",
                                        "fec_adjusted",
                                        "occupation_adjusted",
                                        "age_adjusted",
                                        "description"
                                    ],
                                    properties: {
                                        code: {
                                            type: "string",
                                            description: "Impairment code (XX.XX.XX.XX format)"
                                        },
                                        wpi: {
                                            type: "number",
                                            description: "Initial WPI percentage"
                                        },
                                        fec_adjusted: {
                                            type: "number",
                                            description: "FEC adjusted value (WPI × 1.4)"
                                        },
                                        occupation_adjusted: {
                                            type: "number",
                                            description: "Value after occupation adjustment"
                                        },
                                        age_adjusted: {
                                            type: "number",
                                            description: "Final value after age adjustment"
                                        },
                                        description: {
                                            type: "string",
                                            description: "Description of the impairment"
                                        }
                                    },
                                    additionalProperties: false
                                }
                            },
                            combined_rating: {
                                type: "number",
                                description: "Final combined rating percentage"
                            },
                            combination_steps: {
                                type: "array",
                                items: {
                                    type: "string",
                                    description: "Step by step combination calculations"
                                }
                            }
                        },
                        additionalProperties: false
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "format_rating_string",
                    description: "Format the final rating string with all components",
                    strict: true,
                    parameters: {
                        type: "object",
                        required: [
                            "name",
                            "claim_number",
                            "employer",
                            "ratings",
                            "combined_rating",
                            "pd_weeks",
                            "age_doi",
                            "weekly_earnings",
                            "pd_rate",
                            "pd_total",
                            "future_medical"
                        ],
                        properties: {
                            name: {
                                type: "string",
                                description: "Patient's name"
                            },
                            claim_number: {
                                type: "string",
                                description: "Claim number"
                            },
                            employer: {
                                type: "string",
                                description: "Employer name"
                            },
                            ratings: {
                                type: "array",
                                items: {
                                    type: "object",
                                    required: [
                                        "code",
                                        "wpi",
                                        "fec",
                                        "group_variant",
                                        "adjusted",
                                        "final",
                                        "description"
                                    ],
                                    properties: {
                                        code: {
                                            type: "string",
                                            description: "Impairment code"
                                        },
                                        wpi: {
                                            type: "number",
                                            description: "WPI value"
                                        },
                                        fec: {
                                            type: "string",
                                            description: "FEC adjustment"
                                        },
                                        group_variant: {
                                            type: "string",
                                            description: "Occupation group and variant"
                                        },
                                        adjusted: {
                                            type: "number",
                                            description: "Adjusted value"
                                        },
                                        final: {
                                            type: "number",
                                            description: "Final percentage"
                                        },
                                        description: {
                                            type: "string",
                                            description: "Description of rating"
                                        }
                                    },
                                    additionalProperties: false
                                }
                            },
                            combined_rating: {
                                type: "number",
                                description: "Final combined rating percentage"
                            },
                            pd_weeks: {
                                type: "number",
                                description: "Total weeks of permanent disability"
                            },
                            age_doi: {
                                type: "number",
                                description: "Age at date of injury"
                            },
                            weekly_earnings: {
                                type: "number",
                                description: "Average weekly earnings"
                            },
                            pd_rate: {
                                type: "number",
                                description: "PD weekly rate"
                            },
                            pd_total: {
                                type: "number",
                                description: "Total PD payout"
                            },
                            future_medical: {
                                type: "array",
                                items: {
                                    type: "object",
                                    required: [
                                        "specialty",
                                        "cost"
                                    ],
                                    properties: {
                                        specialty: {
                                            type: "string",
                                            description: "Medical specialty"
                                        },
                                        cost: {
                                            type: "number",
                                            description: "Estimated cost"
                                        }
                                    },
                                    additionalProperties: false
                                }
                            }
                        },
                        additionalProperties: false
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "search_vector_store",
                    description: "Search vector store for JSON files representing occupational tables and age adjustment tables to assist in making calculations.",
                    strict: true,
                    parameters: {
                        type: "object",
                        required: [
                            "file_types",
                            "query",
                            "limit"
                        ],
                        properties: {
                            file_types: {
                                type: "array",
                                description: "List of file types to search for",
                                items: {
                                    type: "string",
                                    description: "Type of file, e.g., 'occupational_table' or 'age_adjustment_table'"
                                }
                            },
                            query: {
                                type: "string",
                                description: "Search query to find relevant tables"
                            },
                            limit: {
                                type: "number",
                                description: "Maximum number of results to return"
                            }
                        },
                        additionalProperties: false
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "code_interpreter",
                    description: "Execute code using OpenAI's code interpreter",
                    strict: true,
                    parameters: {
                        type: "object",
                        properties: {
                            code: {
                                type: "string",
                                description: "Code to execute"
                            }
                        },
                        required: ["code"],
                        additionalProperties: false
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "file_search",
                    description: "Search through files",
                    strict: true,
                    parameters: {
                        type: "object",
                        properties: {
                            query: {
                                type: "string",
                                description: "Search query"
                            }
                        },
                        required: ["query"],
                        additionalProperties: false
                    }
                }
            }
        ];

        // Initialize vector store for file search
        this.vectorStore = null;
        this.initializeVectorStore();
    }

    async initializeVectorStore() {
        try {
            // Initialize vector store with OpenAI
            const response = await this.client.beta.vectorStores.create({
                name: "legal_documents"
            });

            this.vectorStore = response.id;
            console.log('Vector store initialized:', this.vectorStore);

            return this.vectorStore;
        } catch (error) {
            console.error('Error initializing vector store:', error);
            throw error;
        }
    }

    async searchFiles(query, fileType = null) {
        try {
            const messages = [
                { role: "user", content: `Search for: ${query}` }
            ];

            const response = await this.client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: messages,
                tools: [{
                    type: "function",
                    function: {
                        name: "search_vector_store",
                        description: "Search vector store for JSON files representing occupational tables and age adjustment tables to assist in making calculations.",
                        strict: true,
                        parameters: {
                            type: "object",
                            required: [
                                "file_types",
                                "query",
                                "limit"
                            ],
                            properties: {
                                file_types: {
                                    type: "array",
                                    description: "List of file types to search for",
                                    items: {
                                        type: "string",
                                        description: "Type of file, e.g., 'occupational_table' or 'age_adjustment_table'"
                                    }
                                },
                                query: {
                                    type: "string",
                                    description: "Search query to find relevant tables"
                                },
                                limit: {
                                    type: "number",
                                    description: "Maximum number of results to return"
                                }
                            },
                            additionalProperties: false
                        }
                    }
                }],
                tool_choice: { type: "function", function: { name: "search_vector_store" } }
            });

            const searchResults = await this.client.beta.vectorStores.files.search(
                this.vectorStore,
                {
                    query: query,
                    file_type: fileType,
                    max_results: 10
                }
            );

            return searchResults;
        } catch (error) {
            console.error('Error searching files:', error);
            throw error;
        }
    }

    async executeCode(code, language, inputData = {}) {
        try {
            // Execute code using OpenAI's code interpreter
            const messages = [
                {
                    role: "user",
                    content: `Execute the following ${language} code:\n\n${code}`
                }
            ];

            const response = await this.client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: messages,
                tools: [{
                    type: "function",
                    function: {
                        name: "code_interpreter",
                        description: "Execute code using OpenAI's code interpreter",
                        strict: true,
                        parameters: {
                            type: "object",
                            properties: {
                                code: {
                                    type: "string",
                                    description: "Code to execute"
                                }
                            },
                            required: ["code"],
                            additionalProperties: false
                        }
                    }
                }],
                tool_choice: { type: "function", function: { name: "code_interpreter" } }
            });

            // Extract the code execution results
            const result = response.choices[0].message.tool_calls?.[0]?.function?.output;

            if (!result) {
                throw new Error('Code execution failed or returned no output');
            }

            return {
                output: result,
                code: code,
                language: language
            };
        } catch (error) {
            console.error('Error in code execution:', error);
            throw error;
        }
    }

    async processMedicalReport(pdfText, occupation, age) {
        try {
            console.log('Processing medical report...');

            // Initialize conversation with system message
            const messages = [
                {
                    role: "system",
                    content: "You are a Workers' Compensation expert analyzing medical reports for permanent disability ratings. Follow each step carefully and show your work."
                },
                {
                    role: "user",
                    content: `Please analyze this medical report for permanent disability rating.\n\nMedical Report Text:\n${pdfText}\n\nOccupation: ${occupation}\nAge: ${age}`
                }
            ];

            // Step 1: Extract medical information
            const extractionResponse = await this.client.chat.completions.create({
                model: "gpt-4o-mini",
                messages,
                tools: this.tools,
                tool_choice: { type: "function", function: { name: "extract_medical_info" } }
            });

            const toolCall = extractionResponse.choices[0].message.tool_calls[0];
            const extractedInfo = JSON.parse(toolCall.function.arguments);
            
            // Add the assistant's message with the tool call
            messages.push(extractionResponse.choices[0].message);
            
            // Add the tool response message
            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(extractedInfo)
            });

            messages.push({
                role: "assistant",
                content: "Medical information extracted successfully. Now determining occupation group and variants."
            });

            // Step 2: Determine occupation group
            const occupationResponse = await this.client.chat.completions.create({
                model: "gpt-4o-mini",
                messages,
                tools: this.tools,
                tool_choice: { type: "function", function: { name: "determine_occupation_group" } }
            });

            const occupationToolCall = occupationResponse.choices[0].message.tool_calls[0];
            const occupationInfo = JSON.parse(occupationToolCall.function.arguments);
            
            // Add the assistant's message with the tool call
            messages.push(occupationResponse.choices[0].message);
            
            // Add the tool response message
            messages.push({
                role: "tool",
                tool_call_id: occupationToolCall.id,
                content: JSON.stringify(occupationInfo)
            });

            messages.push({
                role: "assistant",
                content: "Occupation group determined. Calculating ratings for each impairment."
            });

            // Step 3: Calculate ratings
            const ratingResponse = await this.client.chat.completions.create({
                model: "gpt-4o-mini",
                messages,
                tools: this.tools,
                tool_choice: { type: "function", function: { name: "calculate_rating" } }
            });

            const ratingToolCall = ratingResponse.choices[0].message.tool_calls[0];
            const ratingInfo = JSON.parse(ratingToolCall.function.arguments);
            
            // Add the assistant's message with the tool call
            messages.push(ratingResponse.choices[0].message);
            
            // Add the tool response message
            messages.push({
                role: "tool",
                tool_call_id: ratingToolCall.id,
                content: JSON.stringify(ratingInfo)
            });

            messages.push({
                role: "assistant",
                content: "Ratings calculated. Formatting final rating string."
            });

            // Step 4: Format final rating string
            const formattingResponse = await this.client.chat.completions.create({
                model: "gpt-4o-mini",
                messages,
                tools: this.tools,
                tool_choice: { type: "function", function: { name: "format_rating_string" } }
            });

            const formattingToolCall = formattingResponse.choices[0].message.tool_calls[0];
            const formattedRating = JSON.parse(formattingToolCall.function.arguments);

            // Return complete analysis
            return {
                extractedInfo,
                occupationInfo,
                ratingInfo,
                formattedRating
            };

        } catch (error) {
            console.error('Error processing medical report:', error);
            throw error;
        }
    }
}

module.exports = new PDRService();
