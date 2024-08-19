import React from 'react'
import { TouchableOpacity, View } from 'react-native'
// import { Bubble, Composer, InputToolbar, Send } from 'react-native-gifted-chat'
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import {Bubble, GiftedChat, Send, IMessage, InputToolbar, Composer} from 'react-native-gifted-chat';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Icon } from 'react-native-elements';
// import FontAwesome, { SolidIcons, RegularIcons, BrandIcons } from 'react-native-fontawesome';

export const renderInputToolbar = (props: any, theme: any) => (
  <InputToolbar
    {...props}
    containerStyle={{
      ...theme.inputToolbar,
      justifyContent: 'center',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 2,
    }}
  />
)

export const renderComposer = (props: any, theme: any, placeholder: string) => (
  <Composer
    {...props}
    textInputStyle={{
      ...theme.inputText,
    }}
    placeholder={placeholder}
    placeholderTextColor={theme.placeholderText}
    // the placeholder is read by accessibility features when multiline is enabled so a label is not necessary (results in double announcing if used)
    textInputProps={{ accessibilityLabel: '' }}
  />
)

export const renderSend = (props: any, theme: any, _pickDocument: () => void) => (
  <Send
    {...props}
    alwaysShowSend={true}
    disabled={!props.text}
    containerStyle={{
      ...theme.sendContainer,
    }}
  >
  <View style={{flexDirection: 'row'}}>
    <TouchableOpacity onPress={_pickDocument}>
      <Icon
          type="font-awesome"
          name="paperclip"
          style={{
            marginBottom: 10,
            marginRight: 10,
            transform: [{rotateY: '180deg'}],
          }}
          size={25}
          color='blue'
          // tvParallaxProperties={undefined}
        />
    </TouchableOpacity>
      
      <Icon
        type="font-awesome"
        name="send"
        style={{marginBottom: 10, marginRight: 10}}
        size={25}
        color='orange'
        // tvParallaxProperties={undefined}
      />
    </View>
    {/* <Icon name="send" size={38} color={props.text ? theme.sendEnabled : theme.sendDisabled} /> */}
  </Send>
)


export const renderBubble = (props: any) => {
  return (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: '#2e64e5',
        },
      }}
      textStyle={{
        right: {
          color: '#fff',
        },
      }}
    />
  );
};

export const scrollToBottomComponent = () => {
  return <FontAwesome name="angle-double-down" size={22} color="#333" />;
};