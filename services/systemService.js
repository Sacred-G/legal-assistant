const Anthropic = require('@anthropic-ai/sdk');

class SystemService {
    constructor() {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY environment variable is required');
        }

        this.client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }

    async generateSystemResponse(message) {
        try {
            const response = await this.client.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 4096,
                messages: [{
                    role: 'user',
                    content: message
                }],
                system: `You are Claude, a helpful AI assistant with access to system operations through MCP tools. You can:
                1. Use the sequential-thinking tool to break down complex problems
                2. Execute system commands and monitor their output
                3. View and analyze system resources
                4. Monitor process status and performance
                5. Manage system configurations
                6. Perform web searches using the google-search tool
                
                When users ask you to perform system operations, use the sequential-thinking tool to:
                - Break down complex tasks into steps
                - Plan and verify each operation
                - Maintain context across multiple steps
                - Filter out irrelevant information
                
                Format your tool usage like this:
                For sequential thinking:
                use sequential-thinking tool sequentialthinking with {
                    "thought": "your current thinking step",
                    "nextThoughtNeeded": true/false,
                    "thoughtNumber": current_number,
                    "totalThoughts": total_estimate
                }

                For web searches:
                use google-search tool search with {
                    "query": "your search query",
                    "num": number_of_results
                }
                
                Always provide clear explanations of what you're doing and why.`
            });

            return response.content[0].text;
        } catch (error) {
            console.error('Error generating system response:', error);
            throw error;
        }
    }
}

module.exports = new SystemService();
