import { supabase } from './supabase'

export interface Conversation {
  id: string
  room_id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export interface CreateConversationData {
  room_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

// 대화 기록 조회
export async function getConversations(roomId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('대화 기록 조회 실패:', error)
    throw new Error('대화 기록을 불러오는데 실패했습니다.')
  }

  return data || []
}

// 새 대화 저장
export async function saveConversation(
  conversationData: CreateConversationData
): Promise<Conversation> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('인증되지 않은 사용자입니다.')
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      ...conversationData,
      user_id: user.id
    })
    .select('*')
    .single()

  if (error) {
    console.error('대화 저장 실패:', error)
    throw new Error('대화를 저장하는데 실패했습니다.')
  }

  return data
}

// 여러 대화를 배치로 저장 (스트리밍 완료 시)
export async function saveBatchConversations(
  conversations: CreateConversationData[]
): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('인증되지 않은 사용자입니다.')
  }

  const conversationsWithUser = conversations.map(conv => ({
    ...conv,
    user_id: user.id
  }))

  const { data, error } = await supabase
    .from('conversations')
    .insert(conversationsWithUser)
    .select('*')

  if (error) {
    console.error('배치 대화 저장 실패:', error)
    throw new Error('대화를 저장하는데 실패했습니다.')
  }

  return data || []
}

// 대화 기록 삭제 (스터디 룸 삭제 시)
export async function deleteRoomConversations(roomId: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('room_id', roomId)

  if (error) {
    console.error('대화 기록 삭제 실패:', error)
    throw new Error('대화 기록을 삭제하는데 실패했습니다.')
  }
}

// 대화 기록을 OpenAI 메시지 형식으로 변환
export function conversationsToMessages(
  conversations: Conversation[]
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  return conversations.map(conv => ({
    role: conv.role as 'system' | 'user' | 'assistant',
    content: conv.content
  }))
}

// 실시간 대화 구독 (Supabase Realtime)
export function subscribeToRoomConversations(
  roomId: string,
  onNewMessage: (conversation: Conversation) => void
) {
  const channel = supabase
    .channel(`room-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        onNewMessage(payload.new as Conversation)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}