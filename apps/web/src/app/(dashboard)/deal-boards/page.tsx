'use client';

import { useRoleContext } from '@shared/context/RoleContext';
import DealBoardsList from '@deal-boards/components/rep/DealBoardsList';
import DealBoardsManagerView from '@deal-boards/components/manager/DealBoardsManagerView';

export default function DealBoardsPage() {
  const { isManager } = useRoleContext();

  if (isManager) {
    return <DealBoardsManagerView />;
  }

  return <DealBoardsList />;
}


