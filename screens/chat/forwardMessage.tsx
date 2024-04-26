import { randomUUID } from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import * as vt from 'expo-video-thumbnails';
import _ from 'lodash';
import { ClientEvent, EventType, IContent, IEvent, MsgType, SyncState } from 'matrix-js-sdk';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Alert, Image as RNImage, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar, Dialog, Icon, Input, ListItem, Text, useTheme } from '@rneui/themed';

import BpayHeader from '../../components/BpayHeader';
import { useGlobalState } from '../../store/globalContext';
import { useMatrixClient } from '../../store/useMatrixClient';
import { globalStyle } from '../../utils/styles';
import { IListItem, ListView } from './components/ListView';
import { roomPreview } from './eventMessage';
import URI from 'urijs';

export default function ForwardMessage({ navigation, route }) {

    const { target, mimetype, roomId } = route.params
    const { client } = useMatrixClient()
    const { theme } = useTheme()
    const [searchVal, setSearchVal] = useState("");
    const [forwardMessage, setForwardMessage] = useState("")
    const [members, setMembers] = useState<IListItem[]>([])
    const [friends, setFriends] = useState<IListItem[]>([])
    const [groups, setGroups] = useState<IListItem[]>([])
    const [seletedItem, setSeletedItem] = useState<IListItem>()
    const [event, setEvent] = useState<Partial<IEvent>>()
    const [cachedFile, setCachedFile] = useState('')
    const [normalizedUrl, setNormalizedUrl] = useState('')

    const [isVisible, setIsVisible] = useState(false)
    const { setLoading } = useGlobalState()

    function initialize() {
        const _members: IListItem[] = [];
        const sessions = client.getSessions();
        sessions.forEach(item => {
            const isDirectRoom = client.isDirectRoom(item.roomId);
            const directMember = isDirectRoom ? item.getMembers().find(i => i.userId !== client.getUserId()) : null;
            const preview = roomPreview(item, client);
            let subTitle = preview.text;
            let updateAt = preview.ts;
            let avatar_url = isDirectRoom
                ? directMember?.getAvatarUrl(client.baseUrl, 50, 50, 'scale', true, true)
                : item?.getAvatarUrl(client.baseUrl, 50, 50, 'scale');
            _members.push({
                id: item.roomId,
                title: item.name,
                subtitle: subTitle,
                right: moment(updateAt).fromNow(),
                avatar: avatar_url
            });
        });
        setMembers(_members);

        // 好友
        const _friends = client.getRooms()
            .filter(room => room.getMyMembership() === 'join')
            .filter(room => client.isDirectRoom(room.roomId))
            .filter(room => room.getMyMembership() === 'join' && (room.getMember(room.guessDMUserId()).membership === 'join' // 正常聊天
                || (room.getMember(room.guessDMUserId()).membership === 'leave'
                    && room.getMember(room.guessDMUserId()).events.member.getPrevContent().membership === 'join')) // 别人退了
            );
        setFriends(_friends.map(room => {
            const friend = room.getMember(room.guessDMUserId());
            return {
                id: room.roomId,
                title: friend.name,
                subtitle: friend.userId,
                avatar: friend.getAvatarUrl(client.baseUrl, 40, 40, 'scale', true, true)
            };
        }));

        // 群组
        const _groups: IListItem[] = [];
        const joindGroups = client.getRooms()
            .filter(room => room.getMyMembership() === 'join')
            .filter(room => !client.isDirectRoom(room.roomId));
        joindGroups.forEach(room => {
            _groups.push({
                id: room.roomId,
                title: room.name,
                subtitle: room.normalizedName,
                avatar: room.getAvatarUrl(client.baseUrl, 50, 50, 'scale')
            });
        });
        setGroups(_groups);
    }

    useEffect(() => {
        initialize();
        const onSync = (state) => {
            if (state === SyncState.Prepared) {
                initialize()
            }
        }
        client.on(ClientEvent.Sync, onSync)
        return () => {
            client.off(ClientEvent.Sync, onSync)
        }
    }, [])

    useEffect(() => {
        // 处理转发和分享消息
        handleShared();
    }, [target])

    useEffect(() => {
        if (event) {
            setNormalizedUrl(client.mxcUrlToHttp(event.content.info?.thumbnail_url || event.content.url, null, null, null, true))
        }
    }, [event])


    const onForward = async (item) => {
        setSeletedItem(item)
        setIsVisible(true)
    }

    const doForward = async () => {
        setIsVisible(false)
        setLoading(true)
        try {
            if (target.startsWith('$')) {
                await client.sendEvent(seletedItem.id as string, EventType.RoomMessage, event.content)
                if (forwardMessage.length > 0) {
                    await client.sendTextMessage(seletedItem.id as string, forwardMessage)
                }
                navigation.goBack()

            } else if (cachedFile) {
                navigation.replace('Room', {
                    id: seletedItem.id, forward: {
                        uri: event.content.url,
                        mimetype: event.content.info.mimetype,
                        message: forwardMessage.length > 0 ? forwardMessage : undefined
                    }
                })
            }
        } catch (e) {
            Alert.alert('错误', e.toString())
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={styles.container}>
            <BpayHeader title='选择一个聊天' showback onBack={() => navigation.replace('Sessions')}></BpayHeader>
            <View>
                <Input value={searchVal} onChangeText={setSearchVal} errorStyle={{ height: 0 }}
                    inputStyle={{ paddingLeft: 10 }}
                    rightIcon={<Icon name='search' color={theme.colors.grey5}></Icon>}
                    containerStyle={{ paddingTop: 10, paddingBottom: 0, marginBottom: 0 }} placeholder='搜索'
                    inputContainerStyle={{ height: 40, borderBottomWidth: 0, backgroundColor: theme.colors.background, borderRadius: 10 }}></Input>
            </View>
            <View style={styles.content}>
                <ScrollView>
                    <ListView search={searchVal} items={members} onPressItem={onForward} accordion accordionTitle='最近会话'></ListView>
                    <ListView search={searchVal} items={friends} onPressItem={onForward} accordion accordionTitle='我的好友'></ListView>
                    <ListView search={searchVal} items={groups} onPressItem={onForward} accordion accordionTitle='我加入的群组'></ListView>
                </ScrollView>
            </View>
            <Dialog isVisible={isVisible} animationType='fade'>
                <Text style={{ fontSize: globalStyle.titleFontStyle.fontSize, fontWeight: 'bold' }}>发送给:</Text>
                {seletedItem && <ListItem containerStyle={{ padding: 10 }}>
                    {seletedItem?.avatar
                        ? <Avatar size={30} rounded source={{ uri: seletedItem?.avatar }}
                            containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                        : <Avatar size={30} rounded title={seletedItem?.title[0].toUpperCase()}
                            containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>}
                    <ListItem.Content>
                        <ListItem.Title style={{ fontSize: 18 }}>{seletedItem?.title}</ListItem.Title>
                    </ListItem.Content>
                </ListItem>}
                {event && <View style={{ marginVertical: 20, paddingHorizontal: 10, alignItems: event?.content.msgtype === MsgType.Text ? null : 'center' }}>
                    {event?.content.msgtype === MsgType.Text && <Text numberOfLines={3}>{event?.content.body}</Text>}
                    {(event?.content.msgtype === MsgType.Image || event?.content.msgtype === MsgType.Video) &&
                        (<View>{event?.content.msgtype === MsgType.Video && <Avatar containerStyle={{
                            position: 'absolute', zIndex: 9999,
                            justifyContent: 'center', height: 150, width: 150
                        }} icon={{ name: 'play', type: 'octicon', color: '#a0a0a0', size: 50 }} size={50}></Avatar>}
                            <Image contentFit='contain'
                                source={{ uri: normalizedUrl }}
                                style={{ width: 150, height: 150 }}></Image>

                        </View>)}
                    {event?.content.msgtype === MsgType.File && <Text numberOfLines={3}>文件:[{event?.content.body}]</Text>}
                </View>}
                <View>
                    <Input placeholder='转发留言' errorStyle={{ height: 0 }}
                        value={forwardMessage} onChangeText={setForwardMessage}
                        inputStyle={{ paddingLeft: 10, fontSize: globalStyle.subTitleFontStyle.fontSize }}
                        inputContainerStyle={{ borderBottomWidth: 0, backgroundColor: theme.colors.grey5, height: 26 }}></Input>
                </View>
                <Dialog.Actions>
                    <Dialog.Button title="转发" onPress={doForward} />
                    <Dialog.Button title="取消" titleStyle={{ color: 'grey' }} onPress={() => setIsVisible(false)} />
                </Dialog.Actions>
            </Dialog>
        </View>
    )

    function handleShared() {
        if (target.startsWith('$')) {
            client.fetchRoomEvent(roomId, target).then(event => {
                setEvent(event);
            });
        } else if (target.startsWith("content://")) {
            const cacheFilename = FileSystem.cacheDirectory + randomUUID()
            setCachedFile(cacheFilename);
            FileSystem.copyAsync({
                from: target,
                to: cacheFilename
            }).then(() => {
                if (mimetype.startsWith("image/")) {
                    RNImage.getSize(cacheFilename, (width, height) => {
                        const localContent: IContent = {
                            msgtype: MsgType.Image,
                            body: cacheFilename,
                            url: cacheFilename,
                            info: {
                                h: height,
                                w: width,
                                mimetype: mimetype,
                                //@ts-ignore
                                // size: fileinfo.size,
                                thumbnail_url: cacheFilename,
                                thumbnail_info: {
                                    w: width,
                                    h: height,
                                    minetype: mimetype,
                                }
                            },
                        };
                        const localEvent: Partial<IEvent> = {
                            type: EventType.RoomMessage,
                            content: localContent
                        };
                        setEvent(localEvent);
                    });
                }
                if (mimetype.startsWith("video/")) {
                    vt.getThumbnailAsync(cacheFilename, { quality: 0.5 }).then(thumb => {
                        const localContent: IContent = {
                            msgtype: MsgType.Video,
                            body: cacheFilename,
                            url: cacheFilename,
                            info: {
                                h: thumb.height,
                                w: thumb.width,
                                mimetype: mimetype,
                                //@ts-ignore
                                // size: fileinfo.size,
                                thumbnail_url: thumb.uri,
                                thumbnail_info: {
                                    w: thumb.width,
                                    h: thumb.height,
                                    minetype: mimetype,
                                }
                            },
                        };
                        const localEvent: Partial<IEvent> = {
                            type: EventType.RoomMessage,
                            content: localContent
                        };
                        setEvent(localEvent);
                    })
                }
                if (mimetype.startsWith("application/")) {
                    const uri = new URI(target)
                    FileSystem.getInfoAsync(cacheFilename, { size: true }).then(info => {
                        const localContent: IContent = {
                            msgtype: MsgType.File,
                            body: uri.filename(),
                            url: cacheFilename,
                            info: {
                                // @ts-ignore
                                size: info.size,
                                mimetype: mimetype,
                                //@ts-ignore
                            },
                        };
                        const localEvent: Partial<IEvent> = {
                            type: EventType.RoomMessage,
                            content: localContent
                        };
                        setEvent(localEvent);
                    })
                }
            });
        }
    }
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
})