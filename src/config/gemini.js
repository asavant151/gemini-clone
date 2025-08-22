import {
    GoogleGenAI,
} from '@google/genai';

async function main(prompt, images = []) {
    const ai = new GoogleGenAI({
        apiKey: "AIzaSyAvfebvc5ycYE5Eyc3dT_pHS-2yI_qletE",
    });
    const config = {
        // temperature: 2,
        // thinkingConfig: {
        //     thinkingBudget: 24576,
        // },
        // tools,
    };
    const model = 'gemini-2.5-flash';

    const parts = [{ text: prompt }];
    if (Array.isArray(images)) {
        for (const img of images) {
            if (img?.base64 && img?.mimeType) {
                parts.push({
                    inlineData: {
                        mimeType: img.mimeType,
                        data: img.base64,
                    }
                });
            }
        }
    }

    const contents = [{ role: 'user', parts }];

    const response = await ai.models.generateContentStream({
        model,
        config,
        contents,
    });
    let text = "";
    for await (const chunk of response) {
        text += chunk.text;
    }
    return text;
}

export default main;