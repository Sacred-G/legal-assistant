
const OpenAI = require('openai');

class AssistantsService {
    constructor() {
        console.log('Initializing AssistantsService...');

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }

        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            defaultHeaders: { 'OpenAI-Beta': 'assistants=v2' }
        });
        console.log('OpenAI client initialized');

        // Set the specific assistant ID for PDR processing
        this.assistantId = 'asst_FxKyMIgG8AOadWmkmHQAWlru';
        console.log('Using PDR processing assistant:', this.assistantId);

        this.initialized = false;
        this.initializationPromise = null;
    }

    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = (async () => {
            try {
                console.log('Testing OpenAI connection...');
                const models = await this.client.models.list();
                console.log('Connection successful, available models:', models.data.length);

                // Verify the assistant exists
                const assistant = await this.client.beta.assistants.retrieve(this.assistantId);
                console.log('Assistant verified:', assistant.id);
                console.log('Assistant name:', assistant.name);
                console.log('Assistant model:', assistant.model);

                this.initialized = true;
            } catch (error) {
                console.error('Initialization failed:', error);
                throw error;
            }
        })();

        return this.initializationPromise;
    }

    async createThread() {
        try {
            console.log('Creating new thread...');
            const threadConfig = { messages: [] };
            console.log('Thread configuration:', JSON.stringify(threadConfig, null, 2));

            const thread = await this.client.beta.threads.create(threadConfig);
            console.log('Thread created:', thread.id);
            return thread;
        } catch (error) {
            console.error('Error creating thread:', error.message);
            console.error('Full error:', error);
            throw error;
        }
    }

    async addMessage(threadId, content, fileIds = []) {
        try {
            console.log('Adding message to thread...');
            console.log('Thread ID:', threadId);
            console.log('Content:', content);
            console.log('File IDs:', fileIds.length ? fileIds : 'None');

            const attachments = fileIds.map(fileId => ({
                file_id: fileId,
                tools: [{ type: "file_search" }, { type: "code_interpreter" }]
            }));

            const messageConfig = {
                role: "user",
                content: content,
                attachments: attachments
            };
            console.log('Message configuration:', JSON.stringify(messageConfig, null, 2));

            const message = await this.client.beta.threads.messages.create(threadId, messageConfig);
            console.log('Message created successfully');
            console.log('Message ID:', message.id);
            console.log('Message role:', message.role);
            console.log('Message content:', message.content?.[0]?.text?.value);
            return message;
        } catch (error) {
            console.error('Error adding message:', error);
            console.error('Error details:', {
                message: error.message,
                type: error.type,
                code: error.code
            });
            throw error;
        }
    }

    async runAssistant(threadId, instructions = "", fileId = null) {
        try {
            console.log('Creating assistant run...');
            console.log('Thread ID:', threadId);
            console.log('Instructions:', instructions || 'None');
            console.log('File ID:', fileId || 'None');
            console.log('Using assistant:', this.assistantId);

            const runConfig = {
                assistant_id: this.assistantId,
                instructions: `${instructions}

Use the following files provided through code_interpreter for calculations:
1. Occupations List (file-89yc6ovmgoptStWro2ufZN) - Contains occupation codes and descriptions
2. Occupational Adjustment Table (file-5cnnAqJngm9jpF4QUUzpyt) - Contains adjustment factors by occupation
3. Age Adjustment (file-DhPyNr9jYkk1UJhYeeQP3C) - Contains age-based adjustment factors
4. Impairment (file-PNRsx4BWRuJL9CWYpamVr7) - Contains impairment codes and values
5. Occupational Groups (file-RjcgSLjqFbfCSvPumG3VWH) - Contains group definitions and variants
You are a specialized workers' compensation analyst. When analyzing claims, you must follow this exact format and provide detailed calculations for each section:

FORMAT REQUIREMENTS:
1. Always analyze in this exact order:
   - Basic Information
   - Rating Calculations
   - Combining Ratings
   - Financial Calculations
   - Future Medical Care
   - Apportionment Analysis
   - Settlement Recommendation

2. For each body part rating, use this format:
   [Body Part]: [Apportionment]% - ([Code] - [WPI] - [1.4][Adjusted] - [Group] - [Standard] - [Final]%) [Clinical Description]

3. Show all rating combinations step by step with this format:
   [First]% C [Second]% = [Result]%

REQUIRED SECTIONS:

python
                import json
                    from typing import Dict, List, Any

async def load_data():
    # Load JSON files from storage
                occupations_data = await window.fs.readFile('file-89yc6ovmgoptStWro2ufZN')
                adjustments_data = await window.fs.readFile('file-5cnnAqJngm9jpF4QUUzpyt')
                age_factors_data = await window.fs.readFile('file-DhPyNr9jYkk1UJhYeeQP3C')
                impairments_data = await window.fs.readFile('file-PNRsx4BWRuJL9CWYpamVr7')
                groups_data = await window.fs.readFile('file-RjcgSLjqFbfCSvPumG3VWH')

    # Parse JSON data
                occupations = json.loads(occupations_data)
                adjustments = json.loads(adjustments_data)
                age_factors = json.loads(age_factors_data)
                impairments = json.loads(impairments_data)
                groups = json.loads(groups_data)

                return {
                    'occupations': occupations,
                    'adjustments': adjustments,
                    'age_factors': age_factors,
                    'impairments': impairments,
                    'groups': groups
                }

CALCULATION FUNCTIONS:
Include these core calculation functions:

pythonCopydef combine_ratings(a: float, b: float) -> float:
                """Combine two ratings using formula: a + b(1-a)"""
                return a + (b * (1 - a))

def apply_fec(wpi: float) -> float:
                """Apply FEC adjustment (1.4 multiplier)"""
                return wpi * 1.4

def lookup_impairment(code: str, impairments: Dict) -> float:
                """Find impairment value from code"""
    # Implementation will depend on JSON structure
                return impairments.get(code, 0.0)

OUTPUT REQUIREMENTS:
For each body part, show:

                Copy[Body Part]:
                - Impairment Code: [XX.XX.XX.XX]
                    - WPI: [X] % (from impairments JSON)
                - FEC: [X] % × 1.4 = [Y] %
                    - Group: [XXX](from groups JSON)
                        - Occupational Adjustment: [X](from adjustments JSON)
                            - Age Adjustment: [X](from age_factors JSON)
                                - Final Rating: [Z] %

                                    Code used:
                [Show the actual calculation code used]

EXAMPLE OUTPUT FORMAT:
Basic Information:
                Name: [Name]
Claim #: [Number]
                [Rest of basic info]

Rating Calculations:
pythonCopy# Show actual code used for each calculation
wpi = lookup_impairment("15.01.02.00", impairments)
fec_adjusted = apply_fec(wpi)
                occ_factor = lookup_occupation("470", adjustments)
                final_rating = fec_adjusted * occ_factor
                print(f"Final rating: {final_rating:.2%}")

Medical Report Text:
${pdfText}

Additional Context:
Occupation: ${occupation}
Age: ${age}`,
                model: "gpt-4o-mini",
                tools: [
                    { type: "code_interpreter" },
                    {
                        type: "file_search",
                        file_search: {
                            ranking_options: {
                                ranker: "default_2024_08_21",
                                score_threshold: 0.0
                            }
                        }
                    }
                ],
                tool_resources: {
                    file_search: {
                        vector_store_ids: ["vs_fLQCmyKFGct0hI4DCCaRhiyw"]
                    },
                    code_interpreter: {
                        file_ids: [
                            "file-89yc6ovmgoptStWro2ufZN", // Occupations List
                            "file-5cnnAqJngm9jpF4QUUzpyt", // Occupational Adjustment Table
                            "file-DhPyNr9jYkk1UJhYeeQP3C", // Age Adjustment
                            "file-PNRsx4BWRuJL9CWYpamVr7", // Impairment
                            "file-RjcgSLjqFbfCSvPumG3VWH", // Occupational Groups
                            ...(fileId ? [fileId] : [])
                        ]
                    }
                }
            };
            console.log('Run configuration:', JSON.stringify(runConfig, null, 2));

            const run = await this.client.beta.threads.runs.create(threadId, runConfig);
            console.log('Run created successfully');
            console.log('Run ID:', run.id);
            console.log('Run status:', run.status);
            console.log('Run model:', run.model);
            return run;
        } catch (error) {
            console.error('Error running assistant:', error);
            console.error('Error details:', {
                message: error.message,
                type: error.type,
                code: error.code
            });
            throw error;
        }
    }

    async getMessages(threadId) {
        try {
            console.log('Fetching messages for thread...');
            console.log('Thread ID:', threadId);

            const messages = await this.client.beta.threads.messages.list(threadId);
            console.log('Messages retrieved successfully');
            console.log('Number of messages:', messages.data.length);
            messages.data.forEach((msg, index) => {
                console.log(`Message ${index + 1}:`);
                console.log('- ID:', msg.id);
                console.log('- Role:', msg.role);
                console.log('- Content type:', msg.content?.[0]?.type);
                if (msg.file_ids?.length) {
                    console.log('- File IDs:', msg.file_ids);
                }
            });
            return messages.data;
        } catch (error) {
            console.error('Error getting messages:', error);
            console.error('Error details:', {
                message: error.message,
                type: error.type,
                code: error.code
            });
            throw error;
        }
    }

    async uploadFile(fileData, purpose = 'assistants') {
        try {
            console.log('Starting file upload...');
            console.log('File purpose:', purpose);
            console.log('File size:', Buffer.isBuffer(fileData) ? `${fileData.length} bytes` : 'Unknown');

            // Handle both file paths and buffers
            const file = Buffer.isBuffer(fileData) ? fileData : fileData;
            const uploadedFile = await this.client.files.create({
                file: file,
                purpose: purpose
            });

            console.log('File uploaded successfully');
            console.log('File ID:', uploadedFile.id);
            console.log('File status:', uploadedFile.status);
            console.log('File purpose:', uploadedFile.purpose);
            return uploadedFile;
        } catch (error) {
            console.error('Error uploading file:', error);
            console.error('Error details:', {
                message: error.message,
                type: error.type,
                code: error.code
            });
            throw error;
        }
    }

    async handleToolOutputs(threadId, runId, toolOutputs) {
        try {
            console.log('Submitting tool outputs...');
            console.log('Thread ID:', threadId);
            console.log('Run ID:', runId);
            console.log('Tool outputs:', JSON.stringify(toolOutputs, null, 2));

            const result = await this.client.beta.threads.runs.submitToolOutputs(
                threadId,
                runId,
                { tool_outputs: toolOutputs }
            );
            console.log('Tool outputs submitted successfully');
            console.log('Run status:', result.status);
            return result;
        } catch (error) {
            console.error('Error submitting tool outputs:', error);
            console.error('Error details:', {
                message: error.message,
                type: error.type,
                code: error.code
            });
            throw error;
        }
    }

    async getRun(threadId, runId) {
        try {
            console.log('Retrieving run status...');
            console.log('Thread ID:', threadId);
            console.log('Run ID:', runId);

            const run = await this.client.beta.threads.runs.retrieve(threadId, runId);
            console.log('Run retrieved successfully');
            console.log('Run details:');
            console.log('- Status:', run.status);
            console.log('- Model:', run.model);
            console.log('- Created at:', new Date(run.created_at * 1000).toISOString());
            if (run.completed_at) {
                console.log('- Completed at:', new Date(run.completed_at * 1000).toISOString());
            }
            if (run.last_error) {
                console.log('- Last error:', run.last_error);
            }
            return run;
        } catch (error) {
            console.error('Error retrieving run:', error);
            console.error('Error details:', {
                message: error.message,
                type: error.type,
                code: error.code
            });
            throw error;
        }
    }

    async cancelRun(threadId, runId) {
        try {
            console.log('Canceling run...');
            console.log('Thread ID:', threadId);
            console.log('Run ID:', runId);

            const result = await this.client.beta.threads.runs.cancel(threadId, runId);
            console.log('Run canceled successfully');
            console.log('Final status:', result.status);
            return result;
        } catch (error) {
            console.error('Error canceling run:', error);
            console.error('Error details:', {
                message: error.message,
                type: error.type,
                code: error.code
            });
            throw error;
        }
    }

    async generateResponse(message, context = '', fileId = null) {
        try {
            console.log('Starting generateResponse...');
            console.log('Message:', message);
            console.log('Context:', context);
            console.log('FileId:', fileId);

            // Ensure assistant is initialized
            console.log('Ensuring assistant is initialized...');
            await this.initialize();

            if (!this.assistantId) {
                throw new Error('Assistant not properly initialized');
            }

            // Create a new thread for each conversation
            console.log('Creating thread...');
            const thread = await this.createThread();
            console.log('Thread created:', thread);

            // Combine message and context into a single message if context exists
            const fullMessage = context ? `${message}\n\nContext: ${context}` : message;

            // Add the combined message to the thread
            console.log('Adding message to thread...');
            await this.addMessage(thread.id, fullMessage);
            console.log('Message added to thread');

            // Run the assistant
            console.log('Starting assistant run...');
            const run = await this.runAssistant(thread.id, "", fileId);

            // Wait for the complete response
            let response;
            do {
                response = await this.streamResponse(thread.id, run.id);

                if (response.status === 'requires_action') {
                    // Handle any required actions here if needed
                    continue;
                }

                if (response.content && response.content[0]) {
                    return response.content[0].text.value;
                }

                // Small delay before next poll
                await new Promise(resolve => setTimeout(resolve, 1000));
            } while (!response.content || !response.content[0]);

            return response.content[0].text.value;
        } catch (error) {
            console.error('Error generating response:', error);
            throw error;
        }
    }

    async streamResponse(threadId, runId, maxAttempts = 30, delayMs = 1000) {
        console.log('Streaming response...');
        console.log('Thread ID:', threadId);
        console.log('Run ID:', runId);

        let attempts = 0;
        let lastStatus = '';

        while (attempts < maxAttempts) {
            try {
                const run = await this.client.beta.threads.runs.retrieve(threadId, runId);
                console.log('Run status:', run.status);

                // Only log status changes to reduce noise
                if (run.status !== lastStatus) {
                    console.log(`Run status changed to: ${run.status}`);
                    lastStatus = run.status;
                }

                switch (run.status) {
                    case 'completed':
                        const messages = await this.client.beta.threads.messages.list(threadId);
                        return messages.data[0];

                    case 'failed':
                        throw new Error(`Run failed: ${run.last_error?.message || 'Unknown error'}`);

                    case 'expired':
                        throw new Error('Run expired');

                    case 'cancelled':
                        throw new Error('Run was cancelled');

                    case 'requires_action':
                        // Handle required actions if needed
                        throw new Error('Run requires action - not implemented');

                    case 'incomplete':
                        // If we've been incomplete for too long, cancel and retry
                        if (attempts > maxAttempts / 2) {
                            console.log('Run stuck in incomplete state, cancelling...');
                            await this.client.beta.threads.runs.cancel(threadId, runId);
                            throw new Error('Run stuck in incomplete state');
                        }
                        break;

                    default:
                        // For 'queued', 'in_progress', etc.
                        break;
                }

                attempts++;
                await new Promise(resolve => setTimeout(resolve, delayMs));

            } catch (error) {
                console.error('Error in streamResponse:', error);
                throw error;
            }
        }

        // If we exit the loop without completing
        await this.client.beta.threads.runs.cancel(threadId, runId);
        throw new Error(`Response streaming timed out after ${maxAttempts} attempts`);
    }

    async processMedicalReport(pdfText, occupation, age, maxRetries = 2) {
        let lastError = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    console.log(`Retry attempt ${attempt} of ${maxRetries}...`);
                    // Wait longer between retries
                    await new Promise(resolve => setTimeout(resolve, attempt * 2000));
                }

                console.log('Processing medical report with Assistants API...');

                // Create a new thread
                const thread = await this.createThread();

                // Add the initial message with PDF content and context
                const message = `You are a specialized workers' compensation analyst. When analyzing claims, you must follow this exact format and provide detailed calculations for each section:

FORMAT REQUIREMENTS:
1. Always analyze in this exact order:
   - Basic Information
   - Rating Calculations
   - Combining Ratings
   - Financial Calculations
   - Future Medical Care
   - Apportionment Analysis
   - Settlement Recommendation

2. For each body part rating, use this format:
   [Body Part]: [Apportionment]% - ([Code] - [WPI] - [1.4][Adjusted] - [Group] - [Standard] - [Final]%) [Clinical Description]

3. Show all rating combinations step by step with this format:
   [First]% C [Second]% = [Result]%

REQUIRED SECTIONS:

python
                import json
                    from typing import Dict, List, Any

async def load_data():
    # Load JSON files from storage
                occupations_data = await window.fs.readFile('file-89yc6ovmgoptStWro2ufZN')
                adjustments_data = await window.fs.readFile('file-5cnnAqJngm9jpF4QUUzpyt')
                age_factors_data = await window.fs.readFile('file-DhPyNr9jYkk1UJhYeeQP3C')
                impairments_data = await window.fs.readFile('file-PNRsx4BWRuJL9CWYpamVr7')
                groups_data = await window.fs.readFile('file-RjcgSLjqFbfCSvPumG3VWH')

    # Parse JSON data
                impairments = json.loads(impairments_data)
                occupations = json.loads(occupations_data)
                adjustments = json.loads(adjustments_data)
                age_factors = json.loads(age_factors_data)
                variants = json.loads(variants_data)

                return {
                    'impairments': impairments,
                    'occupations': occupations,
                    'adjustments': adjustments,
                    'age_factors': age_factors,
                    'variants': variants
                }

CALCULATION FUNCTIONS:
Include these core calculation functions:

def lookup_occupation(occupation_code: str, occupations: Dict) -> float:
                """Find occupation and determine group number and variant based on impairment """
                
                return occupations.get(occupation_code, )

def combine_ratings(a: float, b: float) -> float:
                """Combine two ratings using formula: a + b(1-a)"""
                return a + (b * (1 - a))

def apply_fec(wpi: float) -> float:
                """Apply FEC adjustment (1.4 multiplier)"""
                return wpi * 1.4

def lookup_impairment(code: str, impairments: Dict) -> float:
                """Find impairment value from code"""
    # Implementation will depend on JSON structure
                return impairments.get(code, 0.0)

OUTPUT REQUIREMENTS:
For each body part, show:

                Copy[Body Part]:
                - Impairment Code: [XX.XX.XX.XX]
                    - WPI: [X] % (from impairments JSON)
                - FEC: [X] % × 1.4 = [Y] %
                    - Group: [XXX](from groups JSON)
                        - Occupational Adjustment: [X](from adjustments JSON)
                            - Age Adjustment: [X](from age_factors JSON)
                                - Final Rating: [Z] %

                                    Code used:
                [Show the actual calculation code used]

EXAMPLE OUTPUT FORMAT:
Basic Information:
                Name: [Name]
Claim #: [Number]
                [Rest of basic info]

Rating Calculations:
pythonCopy# Show actual code used for each calculation
wpi = lookup_impairment("15.01.02.00", impairments)
fec_adjusted = apply_fec(wpi)
                occ_factor = lookup_occupation("470", adjustments)
                final_rating = fec_adjusted * occ_factor
                print(f"Final rating: {final_rating:.2%}")

Medical Report Text:
${pdfText}

Additional Context:
Occupation: ${occupation}
Age: ${age}`;

                await this.addMessage(thread.id, message);

                // Run the assistant with specific instructions
                const run = await this.runAssistant(thread.id, "", null);

                // Wait for and return the complete response
                const response = await this.streamResponse(thread.id, run.id);

                if (response.content && response.content[0]) {
                    // Parse the assistant's response into the expected format
                    const analysisText = response.content[0].text.value;
                    return this.parseAssistantResponse(analysisText);
                }

                throw new Error('No content in response');

            } catch (error) {
                console.error(`Attempt ${attempt + 1} failed:`, error);
                lastError = error;

                if (attempt === maxRetries) {
                    console.error('All retry attempts failed');
                    // On final failure, return a valid but empty structure
                    return {
                        extractedInfo: { body_parts: [] },
                        occupationInfo: { body_parts: [] },
                        ratingInfo: { impairments: [], combination_steps: [] },
                        formattedRating: { ratings: [] },
                        error: lastError.message
                    };
                }
            }
        }
    }

    parseAssistantResponse(text) {
        try {
            // Initialize default structure matching PDRService
            const defaultResponse = {
                extractedInfo: {
                    name: '',
                    date_of_birth: '',
                    occupation: '',
                    date_of_injury: '',
                    claim_number: '',
                    body_parts: []
                },
                occupationInfo: {
                    group_number: '',
                    body_parts: []
                },
                ratingInfo: {
                    impairments: [],
                    combined_rating: '',
                    combination_steps: []
                },
                formattedRating: {
                    name: '',
                    claim_number: '',
                    ratings: [],
                    combined_rating: ''
                }
            };

            // Extract sections using regex
            const sections = text.split(/\n\n(?=[A-Z])/);

            // Parse Medical Information section
            const medicalSection = sections.find(s => s.includes('Medical Information'));
            if (medicalSection) {
                const info = this.parseSection(medicalSection);
                defaultResponse.extractedInfo = {
                    ...defaultResponse.extractedInfo,
                    ...info,
                    body_parts: info.body_parts || []
                };
            }

            // Parse Occupation Analysis section
            const occupationSection = sections.find(s => s.includes('Occupation Analysis'));
            if (occupationSection) {
                const info = this.parseSection(occupationSection);
                defaultResponse.occupationInfo = {
                    ...defaultResponse.occupationInfo,
                    ...info
                };
            }

            // Parse Rating Calculations section
            const ratingSection = sections.find(s => s.includes('Rating Calculations'));
            if (ratingSection) {
                const info = this.parseSection(ratingSection);
                defaultResponse.ratingInfo = {
                    ...defaultResponse.ratingInfo,
                    ...info
                };
            }

            // Parse Final Rating section
            const finalSection = sections.find(s => s.includes('Final Rating'));
            if (finalSection) {
                const info = this.parseSection(finalSection);
                defaultResponse.formattedRating = {
                    ...defaultResponse.formattedRating,
                    ...info
                };
            }

            return defaultResponse;
        } catch (error) {
            console.error('Error parsing assistant response:', error);
            // Return default structure even on error
            return {
                extractedInfo: { body_parts: [] },
                occupationInfo: { body_parts: [] },
                ratingInfo: { impairments: [], combination_steps: [] },
                formattedRating: { ratings: [] }
            };
        }
    }

    parseSection(text) {
        try {
            // Try to find JSON-like content between curly braces
            const match = text.match(/{[\s\S]*?}/);
            if (match) {
                return JSON.parse(match[0]);
            }

            // If no JSON found, parse key-value pairs
            const lines = text.split('\n');
            const result = {};

            lines.forEach(line => {
                const [key, ...values] = line.split(':').map(s => s.trim());
                if (key && values.length) {
                    const value = values.join(':').trim();
                    // Convert to array if it looks like a list
                    if (value.includes(',')) {
                        result[this.camelCase(key)] = value.split(',').map(v => v.trim());
                    } else {
                        result[this.camelCase(key)] = value;
                    }
                }
            });

            return result;
        } catch {
            return {};
        }
    }

    camelCase(str) {
        return str.toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
            .replace(/^[A-Z]/, chr => chr.toLowerCase());
    }
}

module.exports = new AssistantsService();
