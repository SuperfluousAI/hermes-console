import { nodeKeyFilesFileSystem } from "@/features/key-files/node-key-files-file-system";
import { readKeyFiles } from "@/features/key-files/read-key-files";

export function readKeyFileContent(fileId: string) {
  const result = readKeyFiles();
  const file = result.files.find((candidate) => candidate.id === fileId) ?? result.files[0] ?? null;

  if (!file) {
    return null;
  }

  const content = nodeKeyFilesFileSystem.readTextFile(file.path);

  return {
    file,
    content,
  };
}
