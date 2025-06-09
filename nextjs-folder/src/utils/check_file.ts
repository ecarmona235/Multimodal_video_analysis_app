export async function checkIfFileExists(fileName: string) {
  const res = await fetch(
    `http://localhost:8000/check-file?file_name=${fileName}`
  );
  return res.status === 200;
}
