import { BasicMessageRepository, ConnectionRecord } from '@credo-ts/core'
import { useAgent, useBasicMessagesByConnectionId, useConnectionById } from '@credo-ts/react-hooks'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'
import { SafeAreaView } from 'react-native-safe-area-context'

import InfoIcon from '../components/buttons/InfoIcon'
import { renderComposer, renderInputToolbar, renderSend } from '../components/chat'
import ActionSlider from '../components/chat/ActionSlider'
import { renderActions } from '../components/chat/ChatActions'
import { ChatMessage } from '../components/chat/ChatMessage'
import { useNetwork } from '../contexts/network'
import { useStore } from '../contexts/store'
import { useTheme } from '../contexts/theme'
import { useChatMessagesByConnection } from '../hooks/chat-messages'
import { Role } from '../types/chat'
import { BasicMessageMetadata, basicMessageCustomMetadata } from '../types/metadata'
import { RootStackParams, ContactStackParams, Screens, Stacks } from '../types/navigators'
import { getConnectionName } from '../utils/helpers'
import { renderBubble, scrollToBottomComponent } from '../components/chat/MessageInput'
import * as DocumentPicker from 'react-native-document-picker';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import InChatFileTransfer from '../components/chat/InChatFileTransfer'


type ChatProps = StackScreenProps<ContactStackParams, Screens.Chat> | StackScreenProps<RootStackParams, Screens.Chat>

const Chat: React.FC<ChatProps> = ({ route }) => {
  if (!route?.params) {
    throw new Error('Chat route params were not set properly')
  }

  const { connectionId } = route.params
  const [store] = useStore()
  const { t } = useTranslation()
  const { agent } = useAgent()
  const navigation = useNavigation<StackNavigationProp<RootStackParams | ContactStackParams>>()
  const connection = useConnectionById(connectionId) as ConnectionRecord
  const basicMessages = useBasicMessagesByConnectionId(connectionId)
  const chatMessages = useChatMessagesByConnection(connection)
  const isFocused = useIsFocused()
  const { assertConnectedNetwork, silentAssertConnectedNetwork } = useNetwork()
  const [showActionSlider, setShowActionSlider] = useState(false)
  const { ChatTheme: theme, Assets } = useTheme()
  const [theirLabel, setTheirLabel] = useState(getConnectionName(connection, store.preferences.alternateContactNames))
  const [isAttachImage, setIsAttachImage] = useState(false);
  const [isAttachFile, setIsAttachFile] = useState(false);
  const [imagePath, setImagePath] = useState('');
  const [filePath, setFilePath] = useState('');

  // This useEffect is for properly rendering changes to the alt contact name, useMemo did not pick them up
  useEffect(() => {
    setTheirLabel(getConnectionName(connection, store.preferences.alternateContactNames))
  }, [isFocused, connection, store.preferences.alternateContactNames])

  useMemo(() => {
    assertConnectedNetwork()
  }, [])

  useEffect(() => {
    navigation.setOptions({
      title: theirLabel,
      headerRight: () => <InfoIcon connectionId={connection?.id as string} />,
    })
  }, [connection, theirLabel])

  // when chat is open, mark messages as seen
  useEffect(() => {
    basicMessages.forEach((msg) => {
      const meta = msg.metadata.get(BasicMessageMetadata.customMetadata) as basicMessageCustomMetadata
      if (agent && !meta?.seen) {
        msg.metadata.set(BasicMessageMetadata.customMetadata, { ...meta, seen: true })
        const basicMessageRepository = agent.context.dependencyManager.resolve(BasicMessageRepository)
        basicMessageRepository.update(agent.context, msg)
      }
    })
  }, [basicMessages])

  const onSend = useCallback(
    async (messages: IMessage[]) => {
      console.log(messages)
      console.log(messages[0].text)
      await agent?.basicMessages.sendMessage(connectionId, messages[0].text)
    },
    [agent, connectionId]
  )

  const onSendRequest = useCallback(async () => {
    navigation.navigate(Stacks.ProofRequestsStack as any, {
      screen: Screens.ProofRequests,
      params: { navigation: navigation, connectionId },
    })
  }, [navigation, connectionId])

  const actions = useMemo(() => {
    return store.preferences.useVerifierCapability
      ? [
          {
            text: t('Verifier.SendProofRequest'),
            onPress: () => {
              setShowActionSlider(false)
              onSendRequest()
            },
            icon: () => <Assets.svg.iconInfoSentDark height={30} width={30} />,
          },
        ]
      : undefined
  }, [t, store.preferences.useVerifierCapability, onSendRequest])

  const renderChatFooter = useCallback(() => {
    if (imagePath) {
      return (
        <View style={styles.chatFooter}>
          <Image source={{uri: imagePath}} style={{height: 75, width: 75}} />
          <TouchableOpacity
            onPress={() => setImagePath('')}
            style={styles.buttonFooterChatImg}
          >
            <Text style={styles.textFooterChat}>X</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (filePath) {
      return (
        <View style={styles.chatFooter}>
          <InChatFileTransfer
            filePath={filePath}
          />
          <TouchableOpacity
            onPress={() => setFilePath('')}
            style={styles.buttonFooterChat}
          >
            <Text style={styles.textFooterChat}>X</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  }, [filePath, imagePath]);

  const onDismiss = () => {
    setShowActionSlider(false)
  }

  const _pickDocument = async () => {
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

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, paddingTop: 20 }}>
      <View style={{ flex: 1 }}>
        <GiftedChat
          messages={chatMessages}
          showAvatarForEveryMessage={true}
          alignTop
          renderAvatar={() => null}
          messageIdGenerator={(msg) => msg?._id.toString() || '0'}
          renderMessage={(props) => <ChatMessage messageProps={props} />}
          renderInputToolbar={(props) => renderInputToolbar(props, theme)}
          renderSend={(props) => renderSend(props, theme, _pickDocument)}
          renderComposer={(props) => renderComposer(props, theme, t('Contacts.TypeHere'))}
          disableComposer={!silentAssertConnectedNetwork()}
          onSend={onSend}
          user={{
            _id: Role.me,
          }}
          alwaysShowSend
          renderActions={(props) => renderActions(props, theme, actions)}
          onPressActionButton={actions ? () => setShowActionSlider(true) : undefined}
          renderBubble={renderBubble}
          scrollToBottom
          scrollToBottomComponent={scrollToBottomComponent}
          renderChatFooter={() => null} 
          messagesContainerStyle={{ paddingBottom: filePath || imagePath ? 90 : 0 }} 
        />
        {showActionSlider && <ActionSlider onDismiss={onDismiss} actions={actions} />}
        {renderChatFooter() && (
          <View style={{ position: 'absolute', bottom: 50, left: 0, right: 0, zIndex: 1 }}>
            {renderChatFooter()}
          </View>
        )}
      </View>
    </SafeAreaView>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  paperClip: {
    marginTop: 8,
    marginHorizontal: 5,
    transform: [{rotateY: '180deg'}],
  },
  sendButton: {marginBottom: 10, marginRight: 10},
  sendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chatFooter: {
    shadowColor: '#1F2687',
    shadowOpacity: 0.37,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 8},
    elevation: -10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    flexDirection: 'row',
    padding: 5,
    backgroundColor: 'white'
    // marginBottom: 10
  },
  fileContainer: {
    flex: 1,
    maxWidth: 300,
    marginVertical: 2,
    borderRadius: 15,
  },
  fileText: {
    marginVertical: 5,
    fontSize: 16,
    lineHeight: 20,
    marginLeft: 10,
    marginRight: 5,
  },
  textTime: {
    fontSize: 10,
    color: 'gray',
    marginLeft: 2,
  },
  buttonFooterChat: {
    width: 35,
    height: 35,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    borderColor: 'black',
    right: 3,
    top: -2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  buttonFooterChatImg: {
    width: 35,
    height: 35,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    borderColor: 'black',
    left: 66,
    top: -4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  textFooterChat: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'gray',
  },
});


export default Chat
