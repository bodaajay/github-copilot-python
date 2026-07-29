import sudoku_logic


def count_prefilled(board):
    return sum(1 for row in board for value in row if value != sudoku_logic.EMPTY)


def test_generate_puzzle_easy_has_unique_solution():
    puzzle, solution = sudoku_logic.generate_puzzle(difficulty='easy')
    assert count_prefilled(puzzle) >= 36
    assert sudoku_logic.has_unique_solution(puzzle)
    assert solution == sudoku_logic.solve(puzzle)


def test_generate_puzzle_medium_has_unique_solution():
    puzzle, solution = sudoku_logic.generate_puzzle(difficulty='medium')
    assert count_prefilled(puzzle) >= 26
    assert sudoku_logic.has_unique_solution(puzzle)
    assert solution == sudoku_logic.solve(puzzle)


def test_generate_puzzle_hard_has_unique_solution():
    puzzle, solution = sudoku_logic.generate_puzzle(difficulty='hard')
    assert count_prefilled(puzzle) >= 20
    assert sudoku_logic.has_unique_solution(puzzle)
    assert solution == sudoku_logic.solve(puzzle)


def test_generate_puzzle_with_clues_parameter():
    puzzle, solution = sudoku_logic.generate_puzzle(clues=35)
    assert count_prefilled(puzzle) >= 32
    assert sudoku_logic.has_unique_solution(puzzle)
    assert solution == sudoku_logic.solve(puzzle)
