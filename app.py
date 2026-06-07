from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import copy

app = Flask(__name__)
CORS(app)

def bubble_sort(arr):
    a = copy.copy(arr)
    n = len(a)
    for i in range(n):
        for j in range(0, n - i - 1):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
    return a

def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result

@app.route('/sort', methods=['POST'])
def sort():
    data = request.get_json()
    nums = data.get('numbers', [])

    if not nums:
        return jsonify({'error': 'No numbers provided'}), 400

    # Bubble sort timing
    start = time.perf_counter()
    bubble_result = bubble_sort(nums)
    bubble_time = time.perf_counter() - start

    # Merge sort timing
    start = time.perf_counter()
    merge_result = merge_sort(nums)
    merge_time = time.perf_counter() - start

    n = len(nums)

    return jsonify({
        'input_size': n,
        'sorted': bubble_result,
        'bubble': {
            'time_seconds': bubble_time,
            'time_ms': bubble_time * 1000,
            'complexity': 'O(n²)',
            'theoretical': n * n,
        },
        'merge': {
            'time_seconds': merge_time,
            'time_ms': merge_time * 1000,
            'complexity': 'O(n log n)',
            'theoretical': n * (n.bit_length()) if n > 0 else 0,
        }
    })

if __name__ == '__main__':
    app.run(port=5050, debug=True)