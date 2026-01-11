import sharp from "sharp";

const MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5MB
const OUTPUT_SIZE_PX = 256;
const OUTPUT_QUALITY = 82;

export interface ProcessedAvatar {
    dataUrl: string;
    mimeType: "image/webp";
    byteLength: number;
    width: number;
    height: number;
}

function assertIsImageFile(file: File): void {
    if (!file.type || !file.type.startsWith("image/")) {
        throw new Error("Tipo de archivo de avatar inválido");
    }
}

export async function processAvatarFile(file: File): Promise<ProcessedAvatar> {
    assertIsImageFile(file);

    if (file.size > MAX_INPUT_BYTES) {
        throw new Error("El archivo de avatar es demasiado grande");
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());

    const outputBuffer = await sharp(inputBuffer)
        .rotate()
        .resize(OUTPUT_SIZE_PX, OUTPUT_SIZE_PX, {
            fit: "cover",
        })
        .webp({
            quality: OUTPUT_QUALITY,
        })
        .toBuffer();

    const base64 = outputBuffer.toString("base64");

    return {
        dataUrl: `data:image/webp;base64,${base64}`,
        mimeType: "image/webp",
        byteLength: outputBuffer.byteLength,
        width: OUTPUT_SIZE_PX,
        height: OUTPUT_SIZE_PX,
    };
}
