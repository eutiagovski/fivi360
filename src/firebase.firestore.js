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

export const handleUpdateImage = async (image) => {
  const docRef = doc(db, "images", image.id);
  delete image.id;

  const resp = await updateDoc(docRef, image)
  return resp
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

export const handleDeleteUserImage = async (docId) => {
  const docRef = doc(db, "images", docId);
  const resp = await deleteDoc(docRef);
  return resp
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
export const handleAddUserAlbum = async (values) => {
  const docRef = await addDoc(collection(db, "albums"), values);
  try {
    console.log("Document written with ID: ", docRef.id);
    return docRef.id
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};
export const handleQueryAlbum = async (albumId) => {
  const docRef = doc(db, "albums", albumId);
  const querySnapshot = await getDoc(docRef);

  const albumDoc = {...querySnapshot.data(), id: albumId}
  return albumDoc;
};
export const handleUpdateUserAlbum = async (album) => {
  const docRef = doc(db, "albums", album.id);
  delete album.id

  const resp = await updateDoc(docRef, album)
  return resp
}

export const handleDeleteUserAlbum = async (album) =>{
  console.log(album)
  const docRef = doc(db, "albums", album);

  const resp = await deleteDoc(docRef)
  return resp
}