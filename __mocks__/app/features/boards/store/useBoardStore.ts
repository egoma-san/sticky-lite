export const useBoardStore = jest.fn(() => ({
  boards: [],
  currentBoard: null,
  members: [],
  isLoading: false,
  error: null,
  fetchBoards: jest.fn(),
  fetchBoardMembers: jest.fn(),
  createBoard: jest.fn(),
  deleteBoard: jest.fn(),
  setCurrentBoard: jest.fn(),
  inviteMember: jest.fn(),
  removeMember: jest.fn(),
  clearError: jest.fn()
}))