import { useEffect, useState } from "react";

function getStorageValue<T>(key: string, defaultValue: T) {
  // getting stored value
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;
  const initial = JSON.parse(saved) as T;
  return initial;
}

export const useLocalStorage: <T>(
  key: string,
  defaultValue: T
) => [T, React.Dispatch<React.SetStateAction<T>>] = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    return getStorageValue(key, defaultValue);
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};
export function useDocumentStore<T extends { uuid: string }>(prefix: string) {
  const [keys, setKeys] = useLocalStorage(`${prefix}-doclist`, [] as string[]);
  const [docs, setDocs] = useState([] as T[]);

  // refresh docs when keys change
  useEffect(() => {
    const docs = keys.map((key) =>
      getStorageValue<any>(`${prefix}-${key}`, null)
    );
    setDocs(docs);
  }, [keys]);

  const updateDoc = (doc: T) => {
    if (!keys.includes(doc.uuid)) {
      throw new Error("Document not in list");
    }
    const key = `${prefix}-${doc.uuid}`;
    localStorage.setItem(key, JSON.stringify(doc));
    setDocs(docs.map((d) => (d.uuid === doc.uuid ? { ...doc } : d)));
  };

  const addDoc = (doc: T) => {
    if (keys.includes(doc.uuid)) {
      throw new Error("Document already in list");
    }
    const key = `${prefix}-${doc.uuid}`;
    localStorage.setItem(key, JSON.stringify(doc));
    setKeys([...keys, doc.uuid]);
    // Docs update is handled by useEffect
  };

  const removeDoc = (doc: T) => {
    if (!keys.includes(doc.uuid)) {
      throw new Error("Document not in list");
    }
    const key = `${prefix}-${doc.uuid}`;
    localStorage.removeItem(key);
    setKeys(keys.filter((k) => k !== doc.uuid));
    // Docs update is handled by useEffect
  };

  return {
    keys,
    docs,
    updateDoc,
    addDoc,
    removeDoc,
  };
}
