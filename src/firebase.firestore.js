import { collection, addDoc, getDocs, query, where, doc, deleteDoc, getDoc, updateDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import app from "./firebase.config";

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export const handleAddDoc = async (values) => {
  try {
    const docRef = await addDoc(collection(db, "images"), values);
    // console.log("Document written with ID: ", docRef.id);
    return docRef.id
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

export const handleUpdateImage = async (imageId, values) => {
  const docRef = doc(db, "images", imageId);
  const updateFields = {...docRef, ...values};

  console.log(updateFields)
  
  updateDoc(docRef, values).then(result => {
    console.log(result)
  });
  return {success: 'Item atualizado com sucesso!'}

};

export const handleGetDocuments = async (collectionRef) => {
  const querySnapshot = await getDocs(collection(db, collectionRef));
  var resultList = [];
  querySnapshot.forEach((doc) => {
    resultList.push({ ...doc.data(), id: doc.id });
  });
  return resultList;
};

export const handleQueryImage = async (imageId) => {
  const docRef = doc(db, "images", imageId);
  const querySnapshot = await getDoc(docRef);

  const imageDoc = {...querySnapshot.data(), id: imageId}
  return imageDoc;
};

export const handleQueryUserImages = async (userId) => {
  const q = query(collection(db, "images"), where("user", "==", userId));

  const querySnapshot = await getDocs(q);
  var resultList = [];

  querySnapshot.forEach((doc) => {
    resultList.push({ ...doc.data(), id: doc.id });
  });
  return resultList;
};

export const handleQueryUserAlbums = async (userId) => {
  const q = query(collection(db, "albums"), where("user", "==", userId));

  const querySnapshot = await getDocs(q);
  var resultList = [];

  querySnapshot.forEach((doc) => {
    resultList.push({ ...doc.data(), id: doc.id });
  });
  return resultList;
};

export const handleDeleteUserImage = (docId) => {
  const docRef = doc(db, "images", docId);
  deleteDoc(docRef)
    .then(() => {
      console.log("Entire Document has been deleted successfully.");
    })
    .catch((error) => {
      console.log(error);
    });
};
