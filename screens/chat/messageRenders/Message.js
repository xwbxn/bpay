import PropTypes from 'prop-types';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-gifted-chat';
import Bubble from 'react-native-gifted-chat';
import { SystemMessage } from 'react-native-gifted-chat';
import { Day } from 'react-native-gifted-chat';
import { StylePropType, isSameUser } from 'react-native-gifted-chat';
import MessageRef from './MessageRef';

const styles = {
    left: StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            paddingLeft: 8,
            marginRight: 0,
        },
    }),
    right: StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            marginLeft: 0,
            paddingRight: 8,
        },
    }),
};
export default class Message extends React.Component {
    shouldComponentUpdate(nextProps) {
        const next = nextProps.currentMessage;
        const current = this.props.currentMessage;
        const { previousMessage, nextMessage } = this.props;
        const nextPropsMessage = nextProps.nextMessage;
        const nextPropsPreviousMessage = nextProps.previousMessage;
        const shouldUpdate = (this.props.shouldUpdateMessage &&
            this.props.shouldUpdateMessage(this.props, nextProps)) ||
            false;
        return (next.sent !== current.sent ||
            next.received !== current.received ||
            next.pending !== current.pending ||
            next.createdAt !== current.createdAt ||
            next.text !== current.text ||
            next.image !== current.image ||
            next.video !== current.video ||
            next.audio !== current.audio ||
            previousMessage !== nextPropsPreviousMessage ||
            nextMessage !== nextPropsMessage ||
            shouldUpdate);
    }
    renderDay() {
        if (this.props.currentMessage && this.props.currentMessage.createdAt) {
            const { containerStyle, onMessageLayout, ...props } = this.props;
            if (this.props.renderDay) {
                return this.props.renderDay(props);
            }
            return <Day {...props}/>;
        }
        return null;
    }
    renderBubble() {
        const { containerStyle, onMessageLayout, ...props } = this.props;
        if (this.props.renderBubble) {
            return this.props.renderBubble(props);
        }
        // @ts-ignore
        return <Bubble {...props}/>;
    }
    renderSystemMessage() {
        const { containerStyle, onMessageLayout, ...props } = this.props;
        if (this.props.renderSystemMessage) {
            return this.props.renderSystemMessage(props);
        }
        return <SystemMessage {...props}/>;
    }
    renderAvatar() {
        const { user, currentMessage, showUserAvatar } = this.props;
        if (user &&
            user._id &&
            currentMessage &&
            currentMessage.user &&
            user._id === currentMessage.user._id &&
            !showUserAvatar) {
            return null;
        }
        if (currentMessage &&
            currentMessage.user &&
            currentMessage.user.avatar === null) {
            return null;
        }
        const { containerStyle, onMessageLayout, ...props } = this.props;
        return <Avatar {...props}/>;
    }
    renderRelation() {
        if(this.props.currentMessage.event?.getContent()['m.relates_to']) {
            const relation = this.props.currentMessage.event.getContent()['m.relates_to']
            const reply_to = relation['m.in_reply_to']?.event_id
            return <MessageRef eventId={reply_to} position={this.props.position}></MessageRef>
        }
    }
    render() {
        const { currentMessage, onMessageLayout, nextMessage, position, containerStyle, } = this.props;
        if (currentMessage) {
            const sameUser = isSameUser(currentMessage, nextMessage);
            return (<View onLayout={e => onMessageLayout(e, currentMessage)}>
          {this.renderDay()}
          {currentMessage.system ? (this.renderSystemMessage()) : (<View style={[
                        styles[position].container,
                        { marginBottom: sameUser ? 2 : 10 },
                        !this.props.inverted && { marginBottom: 2 },
                        containerStyle && containerStyle[position],
                        {backgroundColor:currentMessage.highlight ? '#F3EEEA' : null}
                    ]}>
              {this.props.position === 'left' ? this.renderAvatar() : null}
              {this.renderBubble()}
              {this.props.position === 'right' ? this.renderAvatar() : null}
            </View>)}
            <View style={[
                        { marginBottom: 10, marginTop:sameUser ? 0: -8 },
                        { marginHorizontal: 52}
                    ]}>
                {this.renderRelation()}
            </View>
        </View>);
        }
        return null;
    }
}
Message.defaultProps = {
    renderAvatar: undefined,
    renderBubble: null,
    renderDay: null,
    renderSystemMessage: null,
    position: 'left',
    currentMessage: {},
    nextMessage: {},
    previousMessage: {},
    user: {},
    containerStyle: {},
    showUserAvatar: false,
    inverted: true,
    shouldUpdateMessage: undefined,
    onMessageLayout: undefined,
};
Message.propTypes = {
    renderAvatar: PropTypes.func,
    showUserAvatar: PropTypes.bool,
    renderBubble: PropTypes.func,
    renderDay: PropTypes.func,
    renderSystemMessage: PropTypes.func,
    position: PropTypes.oneOf(['left', 'right']),
    currentMessage: PropTypes.object,
    nextMessage: PropTypes.object,
    previousMessage: PropTypes.object,
    user: PropTypes.object,
    inverted: PropTypes.bool,
    containerStyle: PropTypes.shape({
        left: StylePropType,
        right: StylePropType,
    }),
    shouldUpdateMessage: PropTypes.func,
    onMessageLayout: PropTypes.func,
};
//# sourceMappingURL=Message.js.map