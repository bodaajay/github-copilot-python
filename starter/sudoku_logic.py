import copy
import random

SIZE = 9
EMPTY = 0

DIFFICULTY_LEVELS = {
    'easy': 40,
    'medium': 30,
    'hard': 22,
}


def deep_copy(board):
    return copy.deepcopy(board)


def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]


def is_safe(board, row, col, num):
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True


def find_empty_cell(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                return row, col
    return None


def fill_board(board):
    empty = find_empty_cell(board)
    if empty is None:
        return True
    row, col = empty
    possible = list(range(1, SIZE + 1))
    random.shuffle(possible)
    for candidate in possible:
        if is_safe(board, row, col, candidate):
            board[row][col] = candidate
            if fill_board(board):
                return True
            board[row][col] = EMPTY
    return False


def solve(board):
    board_copy = deep_copy(board)
    if fill_board(board_copy):
        return board_copy
    return None


def count_solutions(board, limit=2):
    empty = find_empty_cell(board)
    if empty is None:
        return 1
    row, col = empty
    total = 0
    for num in range(1, SIZE + 1):
        if is_safe(board, row, col, num):
            board[row][col] = num
            total += count_solutions(board, limit)
            board[row][col] = EMPTY
            if total >= limit:
                break
    return total


def has_unique_solution(board):
    return count_solutions(deep_copy(board), limit=2) == 1


def remove_cells(board, clues):
    positions = [(row, col) for row in range(SIZE) for col in range(SIZE)]
    random.shuffle(positions)
    current_clues = SIZE * SIZE
    for row, col in positions:
        if current_clues <= clues:
            break
        if board[row][col] == EMPTY:
            continue
        saved = board[row][col]
        board[row][col] = EMPTY
        if not has_unique_solution(board):
            board[row][col] = saved
        else:
            current_clues -= 1


def generate_puzzle(clues=35, difficulty=None):
    if difficulty is not None:
        difficulty_key = difficulty.lower()
        if difficulty_key not in DIFFICULTY_LEVELS:
            raise ValueError(f"Unknown difficulty: {difficulty}")
        clues = DIFFICULTY_LEVELS[difficulty_key]

    if clues < 17 or clues > SIZE * SIZE:
        raise ValueError('Clues must be between 17 and 81 for a valid Sudoku')

    board = create_empty_board()
    fill_board(board)
    solution = deep_copy(board)
    if clues < SIZE * SIZE:
        remove_cells(board, clues)
    puzzle = deep_copy(board)
    return puzzle, solution
