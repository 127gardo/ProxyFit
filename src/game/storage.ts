// This file saves and loads the character

import AsyncStorage from "@react-native-async-storage/async-storage";

// AsyncStorage stores data as key -> value
// example: PROXYFIT_CHARACTER -> "{level: 5, strength: 10}"
const CHARACTER_KEY = "PROXYFIT_CHARACTER";

// export means other files can import and use it
// character:any means the function accepts some value named character. The type "any" means "dont check this too strictly"
export async function saveCharacter(character: any) {
  try {
    // Can't store objects directly, so convert to string first
    const json = JSON.stringify(character);
    // AsyncStorage.setItem writes the data
    await AsyncStorage.setItem(CHARACTER_KEY, json);
  } catch (error) {
    console.log("Error saving character:", error);
  }
}

// Retreieve saved data
export async function loadCharacter() {
  try {
    const json = await AsyncStorage.getItem(CHARACTER_KEY);

    // If data exists, convert back to object
    if (json != null) {
      return JSON.parse(json);
    }

    // If no save, return null
    return null;
  } catch (error) {
    console.log("Error loading character:", error);
    return null;
  }
}
