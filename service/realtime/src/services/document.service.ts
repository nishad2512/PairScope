import { inject, injectable } from "tsyringe";
import * as Y from "yjs";
import {
    IDocumentService,
    IRealtimeRepository,
} from "@/interfaces/realtime.interface";
import { IDocumentState } from "@/interfaces/session.interface";
import AppError from "@/utils/AppError";
import { SocketCode } from "@/utils/StatusEnum";

@injectable()
export class DocumentService implements IDocumentService {
    constructor(
        @inject("IRealtimeRepository")
        private readonly repo: IRealtimeRepository,
    ) {}

    async getDocument(sessionId: string): Promise<IDocumentState> {
        return await this.repo.getDocument(sessionId);
    }

    async updateDocument(
        sessionId: string,
        update: Uint8Array,
    ): Promise<number> {
        for (let attempt = 0; attempt < 16; attempt++) {
            const current = await this.repo.getDocument(sessionId);
            const document = new Y.Doc();
            let merged: Uint8Array;

            try {
                Y.applyUpdate(document, current.update);

                try {
                    Y.applyUpdate(document, update);
                } catch {
                    throw new AppError(
                        SocketCode.InvalidPayload,
                        "The document update is invalid.",
                    );
                }

                merged = Y.encodeStateAsUpdate(document);
            } finally {
                document.destroy();
            }

            if (merged.byteLength > 512 * 1024) {
                throw new AppError(
                    SocketCode.DocumentTooLarge,
                    "The shared document exceeds the 512 KiB limit.",
                );
            }

            const revision = await this.repo.saveDocument(sessionId, {
                revision: current.revision,
                update: merged,
            });

            if (revision) {
                return revision;
            }
        }

        throw new AppError(
            SocketCode.ServiceUnavailable,
            "The document is busy. Please retry the update.",
        );
    }
}
