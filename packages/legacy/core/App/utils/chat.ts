import { useState } from 'react';
import * as DocumentPicker from 'react-native-document-picker';
import { IMessage } from 'react-native-gifted-chat';

interface File extends IMessage {
  url?: string;
}

// inside App() 
// declare 4 states
const [isAttachImage, setIsAttachImage] = useState(false);
const [isAttachFile, setIsAttachFile] = useState(false);
const [imagePath, setImagePath] = useState('');
const [filePath, setFilePath] = useState('');

// add a function attach file using DocumentPicker.pick

export const _pickDocument = async () => {
  try {
    const result = await DocumentPicker.pick({
      type: [DocumentPicker.types.allFiles],
      copyTo: 'documentDirectory',
      mode: 'import',
      allowMultiSelection: true,
    });
    const fileUri = result[0].fileCopyUri;
    if (!fileUri) {
      console.log('File URI is undefined or null');
      return;
    }
    if (fileUri.indexOf('.png') !== -1 || fileUri.indexOf('.jpg') !== -1) {
      setImagePath(fileUri);
      setIsAttachImage(true);
    } else {
      setFilePath(fileUri);
      setIsAttachFile(true);
    }
  } catch (err) {
    if (DocumentPicker.isCancel(err)) {
      console.log('User cancelled file picker');
    } else {
      console.log('DocumentPicker err => ', err);
      throw err;
    }
  }
};