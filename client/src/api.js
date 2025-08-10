import axios from "axios";
import FormData from "form-data";

export async function uploadModel(file, price, uploader, modelName, description, inputFormat) {
  const formData = new FormData();
  formData.append("model", file);
  formData.append("price", price);
  formData.append("uploader", uploader);
  formData.append("modelName", modelName);
  formData.append("description", description);
  formData.append("inputFormat", inputFormat); // Must be stringified JSON

  const res = await axios.post("http://localhost:3001/api/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}