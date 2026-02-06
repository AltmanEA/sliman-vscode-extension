# 💻 Monaco Editor - Руководство по использованию

## Обзор

Monaco Editor - это мощный встроенный редактор кода, который предоставляет интерактивные возможности программирования прямо в презентациях slidev. Основан на том же движке, что и Visual Studio Code.

## Установка

При выборе модуля Monaco Editor в расширении автоматически:
- Добавляется зависимость `monaco-editor` в `package.json`
- Создается конфигурация в `slidev.config.ts` с поддержкой 12 языков программирования
- Настраиваются стандартные параметры редактора

## Поддерживаемые языки

Monaco Editor поддерживает следующие языки программирования:

- **JavaScript** - для веб-разработки
- **TypeScript** - типизированный JavaScript
- **Python** - для научных вычислений и анализа данных
- **Java** - объектно-ориентированное программирование
- **C++** - системное программирование
- **C#** - .NET разработка
- **JSON** - формат обмена данными
- **YAML** - конфигурационные файлы
- **Markdown** - форматированный текст
- **HTML** - разметка веб-страниц
- **CSS** - стили веб-страниц
- **SQL** - работа с базами данных
- **Shell** - командная строка

## Синтаксис использования

### Интерактивные блоки кода

Monaco Editor в slidev автоматически делает все блоки кода редактируемыми при включении модуля:

```ts
// Monaco Editor блок - редактируемый в браузере!
// Этот код можно редактировать прямо в браузере!

function helloMonaco() {
    console.log("Monaco Editor работает!");
    return "Привет от Monaco!";
}

// Попробуйте изменить этот код:
const message = "Hello, Monaco!";
console.log(message);
```

```javascript
// JavaScript блок - тоже редактируемый!
const data = [1, 2, 3, 4, 5];
const doubled = data.map(x => x * 2);
console.log('Удвоенные числа:', doubled);
```

### Блоки с подсветкой синтаксиса

```ts
// TypeScript с полной поддержкой типов
interface User {
    id: number;
    name: string;
    email: string;
}

function createUser(userData: User): User {
    return {
        id: Date.now(),
        ...userData
    };
}

const newUser = createUser({
    name: "John Doe",
    email: "john@example.com"
});
```

```python
# Python с поддержкой всех возможностей
import json
from typing import List, Dict

class DataProcessor:
    def __init__(self, data: List[Dict]) -> None:
        self.data = data
    
    def filter_by_key(self, key: str, value: any) -> List[Dict]:
        """Фильтрация данных по ключу и значению"""
        return [item for item in self.data if item.get(key) == value]
    
    def process(self) -> Dict:
        """Обработка данных"""
        return {
            "total": len(self.data),
            "processed": True
        }

# Пример использования
data = [
    {"id": 1, "name": "Alice", "age": 25},
    {"id": 2, "name": "Bob", "age": 30}
]

processor = DataProcessor(data)
result = processor.process()
print(json.dumps(result, indent=2))
```

## Настройки Monaco Editor

### Конфигурация в slidev.config.ts

```typescript
import { defineConfig } from '@slidev/types'

export default defineConfig({
  monaco: true,
  // Monaco Editor configuration
  monacoOptions: {
    theme: 'vs-dark',           // Тема: 'vs-dark', 'vs-light', 'hc-black'
    fontSize: 14,               // Размер шрифта
    lineNumbers: 'on',           // Номера строк: 'on', 'off', 'relative'
    minimap: { enabled: false }, // Мини-карта
    automaticLayout: true        // Автоматическая компоновка
  }
  // Monaco will automatically detect and load supported languages
  // from code blocks in your presentation
})
```

### Темы оформления

#### vs-dark (по умолчанию)
```ts
// Темная тема VS Code
function darkTheme() {
    console.log("Темная тема Monaco");
}
```

#### vs-light
```ts
// Светлая тема VS Code
function lightTheme() {
    console.log("Светлая тема Monaco");
}
```

#### hc-black (High Contrast)
```ts
// Высококонтрастная тема
function highContrast() {
    console.log("Высококонтрастная тема");
}
```

## Возможности Monaco Editor

### 1. Интерактивное редактирование
- **Редактирование в реальном времени** - изменения применяются мгновенно
- **Подсветка синтаксиса** - для всех поддерживаемых языков
- **Автодополнение** - IntelliSense для большинства языков
- **Проверка ошибок** - встроенная проверка синтаксиса

### 2. Навигация и поиск
```js
// Используйте Ctrl+F для поиска
// Ctrl+H для замены
// F12 для перехода к определению

function navigationExample() {
    const data = [1, 2, 3, 4, 5];
    
    // Попробуйте найти "filter" в этом коде
    const filtered = data.filter(x => x > 2);
    
    return filtered;
}
```

### 3. Форматирование кода
```js
// Monaco автоматически форматирует код
const   veryLongVariableName   =   {
    "key1" : "value1" ,
    "key2" : "value2"
};

// После форматирования:
const veryLongVariableName = {
    "key1": "value1",
    "key2": "value2"
};
```

### 4. Сворачивание кода (Code Folding)
```js
// Monaco поддерживает сворачивание блоков кода
class LargeClass {
    constructor() {
        // Этот блок можно свернуть
        this.data = [];
    }
    
    // И этот тоже
    processData() {
        // Сложная логика обработки
        return this.data.map(item => item.transform());
    }
}
```

## Примеры использования в презентациях

### Образовательные примеры

#### JavaScript алгоритмы
```js
// Сортировка пузырьком
function bubbleSort(arr) {
    const n = arr.length;
    
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Обмен элементов
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
    
    return arr;
}

// Тестирование
const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log("Отсортированный массив:", bubbleSort([...numbers]));
```

#### Python анализ данных
```python
import matplotlib.pyplot as plt
import numpy as np

# Генерация данных
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Создание графика
plt.figure(figsize=(8, 6))
plt.plot(x, y, label='sin(x)')
plt.xlabel('X')
plt.ylabel('Y')
plt.title('График функции sin(x)')
plt.legend()
plt.grid(True)
plt.show()

# Статистика
data = [1, 2, 3, 4, 5, 5, 6, 7, 8, 9, 10]
print(f"Среднее: {np.mean(data)}")
print(f"Медиана: {np.median(data)}")
```

#### SQL запросы
```sql
-- Создание таблицы пользователей
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Вставка данных
INSERT INTO users (name, email) VALUES 
    ('Alice Johnson', 'alice@example.com'),
    ('Bob Smith', 'bob@example.com'),
    ('Charlie Brown', 'charlie@example.com');

-- Выборка данных
SELECT 
    name,
    email,
    DATE(created_at) as registration_date
FROM users 
WHERE created_at >= DATE('now', '-30 days')
ORDER BY created_at DESC;

-- Агрегирование
SELECT 
    COUNT(*) as total_users,
    DATE(created_at) as registration_date
FROM users
GROUP BY DATE(created_at)
ORDER BY registration_date;
```

### Интерактивные демонстрации

#### HTML/CSS/JavaScript
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Интерактивная демонстрация</title>
    <style>
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .button {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        
        .button:hover {
            background: #2980b9;
        }
        
        .output {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            min-height: 50px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Интерактивная демонстрация</h1>
        <button class="button" onclick="showMessage()">Нажми меня!</button>
        <div class="output" id="output"></div>
    </div>

    <script>
        function showMessage() {
            const output = document.getElementById('output');
            const messages = [
                'Привет от Monaco Editor!',
                'JavaScript работает отлично!',
                'Интерактивность - это круто!',
                'Можно изменять код в реальном времени!'
            ];
            
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            output.innerHTML = `<strong>${randomMessage}</strong><br>Время: ${new Date().toLocaleTimeString()}`;
        }
        
        // Автоматический запуск
        showMessage();
    </script>
</body>
</html>
```

## Лучшие практики

### 1. Размеры и отступы
```monaco
// Используйте 2-4 пробела для отступов
function goodFormatting() {
    const data = {
        key1: "value1",
        key2: "value2",
        nested: {
            level2: "value3"
        }
    };
    
    return data;
}
```

### 2. Комментарии и документация
```monaco
/**
 * Функция для вычисления факториала
 * @param {number} n - Число для вычисления факториала
 * @returns {number} Факториал числа n
 * @throws {Error} Если n отрицательное число
 */
function factorial(n) {
    if (n < 0) {
        throw new Error("Факториал не определен для отрицательных чисел");
    }
    
    if (n === 0 || n === 1) {
        return 1;
    }
    
    return n * factorial(n - 1);
}

// Примеры использования:
console.log(factorial(5));  // 120
console.log(factorial(0));  // 1
```

### 3. Обработка ошибок
```monaco
// Всегда обрабатывайте потенциальные ошибки
function safeDivision(a, b) {
    try {
        if (typeof a !== 'number' || typeof b !== 'number') {
            throw new Error('Параметры должны быть числами');
        }
        
        if (b === 0) {
            throw new Error('Деление на ноль недопустимо');
        }
        
        return a / b;
    } catch (error) {
        console.error('Ошибка:', error.message);
        return null;
    }
}

// Тестирование
console.log(safeDivision(10, 2));  // 5
console.log(safeDivision(10, 0));  // null
console.log(safeDivision("10", 2)); // null
```

### 4. Модульность кода
```monaco
// Разделяйте код на логические блоки
const MathUtils = {
    // Геометрия
    circleArea: (radius) => Math.PI * radius ** 2,
    circlePerimeter: (radius) => 2 * Math.PI * radius,
    
    // Статистика
    average: (numbers) => numbers.reduce((sum, num) => sum + num, 0) / numbers.length,
    median: (numbers) => {
        const sorted = [...numbers].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 
            ? (sorted[middle - 1] + sorted[middle]) / 2 
            : sorted[middle];
    }
};

// Использование
const numbers = [1, 2, 3, 4, 5];
console.log('Среднее:', MathUtils.average(numbers)); // 3
console.log('Медиана:', MathUtils.median(numbers));  // 3
console.log('Площадь круга (r=5):', MathUtils.circleArea(5)); // ~78.54
```

## Устранение неполадок

### Проблема: Monaco Editor не загружается

**Решение:**
1. Убедитесь, что модуль Monaco выбран при создании лекции
2. Проверьте наличие `monaco-editor` в зависимостях package.json
3. Убедитесь, что в `slidev.config.ts` есть `monaco: true`

### Проблема: Языки не поддерживаются

**Решение:**
```typescript
// В slidev.config.ts добавьте:
monacoLanguages: [
    'javascript', 'typescript', 'python', 'java',
    'cpp', 'csharp', 'json', 'yaml', 'markdown',
    'html', 'css', 'sql', 'shell'
]
```

### Проблема: Низкая производительность

**Решение:**
```typescript
// Отключите ненужные функции в monacoOptions:
monacoOptions: {
    minimap: { enabled: false },    // Отключить мини-карту
    wordWrap: 'off',               // Отключить перенос слов
    renderWhitespace: 'none'       // Не отображать пробелы
}
```

### Проблема: Темная тема не применяется

**Решение:**
```typescript
// Убедитесь, что тема указана правильно:
monacoOptions: {
    theme: 'vs-dark'  // vs-dark, vs-light, или hc-black
}
```

## Интеграция с другими модулями

### Monaco + Shiki (подсветка синтаксиса)
```typescript
// В slidev.config.ts
export default defineConfig({
  monaco: true,
  shiki: {
    themes: {
      dark: 'github-dark',
      light: 'github-light'
    }
  }
})
```

### Monaco + KaTeX (математика)
```monaco
// Monaco блок с математическими вычислениями
function mathExample() {
    // JavaScript поддерживает математические операции
    const a = 5;
    const b = 3;
    
    // Сложение
    const sum = a + b;  // 8
    
    // Умножение
    const product = a * b;  // 15
    
    // Степень
    const power = Math.pow(a, b);  // 125
    
    // Квадратный корень
    const sqrt = Math.sqrt(16);  // 4
    
    return {
        sum,
        product,
        power,
        sqrt
    };
}
```

## Заключение

Monaco Editor предоставляет мощные возможности для интерактивного программирования в презентациях slidev. Правильное использование позволяет создавать образовательные и демонстрационные материалы высокого качества.

### Ключевые преимущества:
- ✅ **Интерактивность** - код можно редактировать в реальном времени
- ✅ **Многоязычность** - поддержка 12+ языков программирования
- ✅ **Профессиональность** - тот же редактор, что в VS Code
- ✅ **Образовательность** - отличный инструмент для обучения программированию
- ✅ **Интеграция** - работает с другими модулями slidev

### Рекомендации по использованию:
1. Используйте Monaco для интерактивных примеров кода
2. Демонстрируйте алгоритмы и их пошаговое выполнение
3. Показывайте различия между языками программирования
4. Создавайте образовательные мини-проекты прямо в презентации

Для получения дополнительной информации посетите официальную документацию Monaco Editor.