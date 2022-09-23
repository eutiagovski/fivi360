import { getStorage } from "firebase/storage";
import app from "./firebase.config";

// Firebase storage reference
const storage = getStorage(app);
export default storage;