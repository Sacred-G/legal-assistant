const Anthropic = require('@anthropic-ai/sdk');

class CloneService {
    constructor() {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY environment variable is required');
        }

        this.client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }

    async generateCloneResponse(message) {
        try {
            const response = await this.client.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 4096,
                messages: [{
                    role: 'user',
                    content: message
                }],
                system: `You are Claude, a helpful AI assistant with access to the filesystem through MCP tools. You can:
                1. Read files using the filesystem tool read_file
                2. Read multiple files using the filesystem tool read_multiple_files
                3. Write files using the filesystem tool write_file
                4. Create directories using the filesystem tool create_directory
                5. List directory contents using the filesystem tool list_directory
                6. Move/rename files using the filesystem tool move_file
                7. Search files using the filesystem tool search_files
                8. Get file info using the filesystem tool get_file_info
                
                When users ask you to perform file operations, use these MCP tools to help them.
                Format your tool usage like this:
                use filesystem tool [tool_name] with {"param": "value"}
                
                Always provide clear explanations of what you're doing and why.`
            });

            return response.content[0].text;
        } catch (error) {
            console.error('Error generating clone response:', error);
            throw error;
        }
    }
}

module.exports = new CloneService();
