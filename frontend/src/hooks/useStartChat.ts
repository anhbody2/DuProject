import { useNavigate } from 'react-router';
import { toast } from '@/lib/toast';
import { useAppDispatch, useAuth } from '@/redux';
import { errorMessage, useOpenStoreChatMutation, useOpenSupportForMutation } from '@/redux/api';
import { openChat } from '@/redux/slices/uiSlice';
import type { Conversation } from '@/redux/types';

/** Opens (creating if needed) a conversation and shows it in the chat panel. */
export function useStartChat() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [openStore, storeState] = useOpenStoreChatMutation();
  const [openSupportFor, supportState] = useOpenSupportForMutation();

  const show = (p: Promise<Conversation>) =>
    p.then((c) => dispatch(openChat(c.id))).catch((e) => toast(errorMessage(e)));

  return {
    busy: storeState.isLoading || supportState.isLoading,
    /** Direct chat with a store's owner. */
    withStore: (storeId: number) => {
      if (!token) {
        toast('Đăng nhập để nhắn tin cho quán nhé');
        navigate('/login');
        return;
      }
      void show(openStore(storeId).unwrap());
    },
    /** Admin: the user's support thread. */
    supportFor: (userId: number) => void show(openSupportFor(userId).unwrap()),
  };
}
