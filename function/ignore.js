import fs from "fs";

const ignoreFilePath = "ignore.json";

export const readIgnoreList = async () => {
  try {
    const data = fs.readFileSync(ignoreFilePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      // File doesn't exist, create it with an empty array
      await writeIgnoreList([]);
      return [];
    }
    console.error("Error reading ignore list:", error);
    return [];
  }
};

export const writeIgnoreList = async (list) => {
  try {
    fs.writeFileSync(ignoreFilePath, JSON.stringify(list, null, 2));
    console.log("Ignore list updated successfully.");
  } catch (error) {
    console.error("Error writing to ignore list:", error);
  }
};
