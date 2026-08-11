// Stub for pdf-parse — prevents @napi-rs/canvas native GC handle from loading in tests
const pdfParse = jest.fn().mockResolvedValue({ text: '' });
export default pdfParse;
module.exports = pdfParse;
