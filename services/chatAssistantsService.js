import OpenAI from 'openai';

class ChatAssistantsService {
    constructor() {
        console.log('Initializing ChatAssistantsService...');

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }

        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            defaultHeaders: { 'OpenAI-Beta': 'assistants=v2' }
        });
        console.log('OpenAI client initialized');

        // Use existing assistant ID
        this.assistantId = 'asst_FxKyMIgG8AOadWmkmHQAWlru';
        this.vectorStoreId = 'vs_fLQCmyKFGct0hI4DCCaRhiyw';
        
        // Update assistant configuration
        this.updateAssistantConfig();
        console.log('Using existing assistant:', this.assistantId);
    }

    async uploadFile(fileBuffer, fileName) {
        try {
            console.log('Uploading file:', fileName);
            const file = await this.client.files.create({
                file: fileBuffer,
                purpose: 'assistants'
            });
            console.log('File uploaded successfully:', file.id);
            return file;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    async updateAssistantConfig() {
        try {
            console.log('Updating assistant configuration...');
            
            // Get current assistant configuration
            const assistant = await this.client.beta.assistants.retrieve(this.assistantId);
            const currentFileIds = assistant.tool_resources?.code_interpreter?.file_ids || [];
            
            // Update configuration while preserving existing file_ids
            await this.client.beta.assistants.update(this.assistantId, {
                tools: [
                    { type: "code_interpreter" },
                    { type: "file_search" }
                ],
                tool_resources: {
                    code_interpreter: {
                        file_ids: currentFileIds
                    },
                    file_search: {
                        vector_store_ids: [this.vectorStoreId]
                    }
                },
                metadata: {
                    parallel_tool_calling: "true"
                }
            });
            console.log('Assistant configuration updated successfully');
        } catch (error) {
            console.error('Error updating assistant tools:', error);
            throw error;
        }
    }

    async createThread() {
        try {
            console.log('Creating new thread');
            const thread = await this.client.beta.threads.create();
            console.log('Thread created:', thread.id);
            return thread;
        } catch (error) {
            console.error('Error creating thread:', error);
            throw error;
        }
    }

    async addMessage(threadId, content, fileId = null) {
        try {
            console.log('Adding message to thread:', threadId);
            const messageConfig = {
                role: 'user',
                content: content
            };

            if (fileId) {
                messageConfig.file_ids = [fileId];
            }

            const message = await this.client.beta.threads.messages.create(
                threadId,
                messageConfig
            );
            console.log('Message added:', message.id);
            return message;
        } catch (error) {
            console.error('Error adding message:', error);
            throw error;
        }
    }

    async runAssistant(threadId) {
        try {
            console.log('Running assistant on thread:', threadId);
            const run = await this.client.beta.threads.runs.create(
                threadId,
                { 
                    assistant_id: this.assistantId,
                    metadata: {
                        parallel_tool_calling: "true"
                    }
                }
            );

            // Wait for completion
            let runStatus = await this.client.beta.threads.runs.retrieve(
                threadId,
                run.id
            );

            while (runStatus.status !== 'completed') {
                if (runStatus.status === 'failed') {
                    throw new Error(`Run failed: ${runStatus.last_error?.message || 'Unknown error'}`);
                }

                if (runStatus.status === 'requires_action') {
                    // Handle required actions for tool calls
                    const requiredAction = runStatus.required_action;
                    const toolCalls = requiredAction.submit_tool_outputs.tool_calls;
                    
                    const toolOutputs = [];
                    for (const toolCall of toolCalls) {
                        // Log tool call for debugging
                        console.log('Tool call:', {
                            id: toolCall.id,
                            type: toolCall.type,
                            function: toolCall.function
                        });
                        
                        // Add tool outputs (in this case we let the assistant handle the tool responses)
                        toolOutputs.push({
                            tool_call_id: toolCall.id,
                            output: "Tool call acknowledged"
                        });
                    }

                    // Submit tool outputs back to the run
                    await this.client.beta.threads.runs.submitToolOutputs(
                        threadId,
                        run.id,
                        { tool_outputs: toolOutputs }
                    );
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
                runStatus = await this.client.beta.threads.runs.retrieve(
                    threadId,
                    run.id
                );
            }

            // Get messages after completion
            const messages = await this.client.beta.threads.messages.list(threadId);
            const assistantMessage = messages.data.find(m => m.role === 'assistant');

            if (!assistantMessage?.content?.[0]?.text?.value) {
                throw new Error('No response from assistant');
            }

            return assistantMessage.content[0].text.value;
        } catch (error) {
            console.error('Error running assistant:', error);
            throw error;
        }
    }

    async processFile(fileBuffer, fileName) {
        try {
            // Upload file
            const file = await this.uploadFile(fileBuffer, fileName);
            
            // Add file to vector store
            await this.client.beta.vectorStores.files.create(
                this.vectorStoreId,
                { file_id: file.id }
            );
            console.log('File added to vector store:', file.id);

            // Get current assistant configuration
            const assistant = await this.client.beta.assistants.retrieve(this.assistantId);
            const currentFileIds = assistant.tool_resources?.code_interpreter?.file_ids || [];
            
            // Update assistant to include file in code_interpreter while preserving existing files
            await this.client.beta.assistants.update(this.assistantId, {
                tool_resources: {
                    code_interpreter: {
                        file_ids: [...currentFileIds, file.id]
                    },
                    file_search: {
                        vector_store_ids: [this.vectorStoreId]
                    }
                }
            });
            console.log('File added to code_interpreter:', file.id);
            
            // Create thread with tools configuration
            const thread = await this.createThread();
            
            // Update thread with tools and vector store
            await this.client.beta.threads.update(thread.id, {
                tools: [
                    { type: "code_interpreter" },
                    { type: "file_search" }
                ],
                metadata: {
                    parallel_tool_calling: "true"
                }
            });

            return {
                fileId: file.id,
                threadId: thread.id
            };
        } catch (error) {
            console.error('Error processing file:', error);
            throw error;
        }
    }

    async generateResponse(threadId, message, fileId = null) {
        try {
            // Add message to thread
            await this.addMessage(threadId, message, fileId);
            
            // Run assistant and get response
            const response = await this.runAssistant(threadId);
            
            return response;
        } catch (error) {
            console.error('Error generating response:', error);
            throw error;
        }
    }
}

export default new ChatAssistantsService();
