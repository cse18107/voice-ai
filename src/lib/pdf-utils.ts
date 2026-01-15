import { extractText } from "unpdf";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        // Convert Node.js Buffer to Uint8Array
        const uint8Array = new Uint8Array(buffer);
        
        // Extract text using unpdf
        const { text } = await extractText(uint8Array);

        // Ensure text is a string (handle potential array)
        const content = Array.isArray(text) ? text.join("\n") : text;
        
        return content || "";
    } catch (error) {
        console.error("PDF Extraction Error:", error);
        return "";
    }
}
