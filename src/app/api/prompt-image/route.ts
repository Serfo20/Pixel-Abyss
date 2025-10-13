import { NextResponse } from "next/server";
import Replicate from "replicate";

const token = process.env.REPLICATE_API_TOKEN!;
const model = process.env.REPLICATE_MODEL || "black-forest-labs/flux-dev";

type PromptBody = {
  prompt: string;
  filename?: string;
};

type ReplicateOutput = { url?: () => string } | string | string[] | null;

export async function POST(req: Request) {
  try {
    if (!token) {
      return NextResponse.json({ error: "Falta REPLICATE_API_TOKEN" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<PromptBody>;
    const prompt = typeof body.prompt === "string" ? body.prompt : "";
    const filename = typeof body.filename === "string" ? body.filename : `gen_${Date.now()}`;

    if (!prompt) {
      return NextResponse.json({ error: "Falta prompt" }, { status: 400 });
    }

    const replicate = new Replicate({ auth: token as string });

    // @ts-expect-error: el sdk no tipa bien run() en este uso
    const output: ReplicateOutput = await replicate.run(`${model}`, {
      input: { prompt },
    });

    let remoteUrl = "";
    if (output && typeof output === "object" && "url" in output && typeof output.url === "function") {
      remoteUrl = output.url();
    } else if (Array.isArray(output) && output.length) {
      remoteUrl = String(output[0]);
    } else if (typeof output === "string") {
      remoteUrl = output;
    }

    if (!remoteUrl || !/^https?:\/\//.test(remoteUrl)) {
      return NextResponse.json({ error: "No se pudo obtener URL de imagen" }, { status: 500 });
    }

    return NextResponse.json({ url: remoteUrl, name: filename });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error generando imagen";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
