import { NextResponse } from "next/server";
import Replicate from "replicate";

const token = process.env.REPLICATE_API_TOKEN!;
const model = process.env.REPLICATE_MODEL || "black-forest-labs/flux-dev";

export async function POST(req: Request) {
  try {
    if (!token) {
      return NextResponse.json({ error: "Falta REPLICATE_API_TOKEN" }, { status: 500 });
    }
    const body = await req.json().catch(() => ({}));
    const { prompt, filename = `gen_${Date.now()}` } = body || {};
    if (!prompt) {
      return NextResponse.json({ error: "Falta prompt" }, { status: 400 });
    }

    const replicate = new Replicate({ auth: token as string });
    // @ts-ignore: tipos del sdk son permisivos
    const output = await replicate.run(`${model}`, {
      input: {
        prompt,
        // guía para estilo pixelado
        // añade condicionalmente si quieres: "pixel art, 32x24, limited palette, chunky pixels"
      },
    });

    // El SDK v1 devuelve un objeto con url() ó un array de urls.
    let remoteUrl = "";
    if (output && typeof (output as any).url === "function") {
      remoteUrl = (output as any).url();
    } else if (Array.isArray(output) && output.length) {
      remoteUrl = String(output[0]);
    } else if (typeof output === "string") {
      remoteUrl = output;
    }

    if (!remoteUrl || !/^https?:\/\//.test(remoteUrl)) {
      return NextResponse.json({ error: "No se pudo obtener URL de imagen" }, { status: 500 });
    }

    // Devolvemos la URL directa de entrega de Replicate (no guardamos en disco aquí)
    return NextResponse.json({ url: remoteUrl, name: filename });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Error generando imagen" }, { status: 500 });
  }
}
