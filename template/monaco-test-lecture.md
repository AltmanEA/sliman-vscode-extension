---
title: Monaco Editor Test Lecture
canvasWidth: 1280
routerMode: history
---

# Monaco Editor Test

## Interactive Code Editing

### JavaScript Example

```javascript
// Monaco Editor блок - редактируемый в браузере!
// Этот код можно редактировать прямо в браузере!

function helloMonaco() {
    console.log("Monaco Editor работает!");
    return "Привет от Monaco!";
}

// Попробуйте изменить этот код:
const message = "Hello, Monaco!";
console.log(message);

// Математические вычисления
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log(`Сумма чисел: ${sum}`);

// Объекты и массивы
const user = {
    name: "MonacoTest",
    age: 25,
    skills: ["JavaScript", "Python", "TypeScript"]
};

console.log(`Пользователь: ${user.name}, возраст: ${user.age}`);
console.log(`Навыки: ${user.skills.join(", ")}`);
```

### Python Example

```python
# Python с полной поддержкой синтаксиса Monaco
import json
from typing import List, Dict, Optional

class DataAnalyzer:
    def __init__(self, data: List[Dict]) -> None:
        self.data = data
        self.processed = False
    
    def analyze(self) -> Dict[str, any]:
        """Анализ данных"""
        if not self.data:
            return {"error": "Нет данных для анализа"}
        
        # Статистика
        ages = [item.get('age', 0) for item in self.data if isinstance(item.get('age'), (int, float))]
        
        analysis = {
            "total_records": len(self.data),
            "age_stats": {
                "min": min(ages) if ages else 0,
                "max": max(ages) if ages else 0,
                "average": sum(ages) / len(ages) if ages else 0
            },
            "processed": True
        }
        
        self.processed = True
        return analysis

# Пример использования
sample_data = [
    {"name": "Алиса", "age": 25, "city": "Москва"},
    {"name": "Боб", "age": 30, "city": "СПб"},
    {"name": "Чарли", "age": 28, "city": "Новосибирск"}
]

analyzer = DataAnalyzer(sample_data)
result = analyzer.analyze()
print(json.dumps(result, ensure_ascii=False, indent=2))
```

### TypeScript Example

```typescript
// TypeScript с полной поддержкой типов
interface User {
    id: string;
    name: string;
    email: string;
    age?: number;
    skills: string[];
}

class UserManager {
    private users: Map<string, User> = new Map();

    addUser(user: User): void {
        this.users.set(user.id, user);
    }

    getUser(id: string): User | undefined {
        return this.users.get(id);
    }

    getAllUsers(): User[] {
        return Array.from(this.users.values());
    }

    findUsersBySkill(skill: string): User[] {
        return this.getAllUsers().filter(user => 
            user.skills.includes(skill)
        );
    }
}

// Демонстрация использования
const userManager = new UserManager();

const alice: User = {
    id: "1",
    name: "Alice",
    email: "alice@example.com",
    age: 25,
    skills: ["JavaScript", "TypeScript", "React"]
};

const bob: User = {
    id: "2", 
    name: "Bob",
    email: "bob@example.com",
    age: 30,
    skills: ["Python", "Django", "PostgreSQL"]
};

userManager.addUser(alice);
userManager.addUser(bob);

const tsUsers = userManager.findUsersBySkill("TypeScript");
console.log("TypeScript developers:", tsUsers);
```

---

# Monaco Editor Features

## ✨ Features Available:

- **Interactive Editing** - Edit code directly in browser
- **Syntax Highlighting** - Beautiful syntax highlighting for all languages
- **Auto-completion** - IntelliSense and auto-completion
- **Error Detection** - Real-time error highlighting
- **Multiple Themes** - Dark, light, and high contrast themes
- **Code Folding** - Collapse/expand code blocks
- **Search & Replace** - Find and replace functionality
- **Multiple Cursors** - Multi-cursor editing support

## 🔧 Supported Languages:

- JavaScript, TypeScript
- Python
- Java, C++, C#
- PHP, Go, Rust
- SQL, JSON, YAML
- HTML, CSS, Shell
- And many more!

---

# Troubleshooting

## If Monaco Editor doesn't work:

1. **Check packages installed:**
   ```bash
   npm install monaco-editor @slidev/preset-monaco
   ```

2. **Verify configuration in slidev.config.ts:**
   ```typescript
   export default defineConfig({
     monaco: true,
     monacoOptions: {
       theme: 'vs-dark'
     }
   })
   ```

3. **Browser compatibility:**
   - Monaco Editor requires modern browsers
   - Chrome, Firefox, Safari, Edge (latest versions)

4. **Memory considerations:**
   - Monaco Editor is memory-intensive
   - Large presentations may impact performance

---

# Advanced Configuration

## Custom Monaco Options

```typescript
// slidev.config.ts
export default defineConfig({
  monaco: true,
  monacoOptions: {
    theme: 'vs-dark',           // 'vs-dark', 'vs-light', 'hc-black'
    fontSize: 16,               // Font size
    fontFamily: 'Fira Code',     // Custom font
    fontLigatures: true,        // Enable font ligatures
    lineNumbers: 'on',           // 'on', 'off', 'relative'
    minimap: { enabled: true },  // Enable minimap
    automaticLayout: true,      // Auto-adjust layout
    wordWrap: 'on',             // Word wrapping
    tabSize: 2,                 // Tab size
    insertSpaces: true          // Use spaces instead of tabs
  }
})
```

## Language-Specific Configuration

```typescript
// Monaco automatically detects languages from code blocks
// But you can also specify explicitly:

```javascript
// JavaScript - will be highlighted and editable
```

```python
# Python - will be highlighted and editable  
```

```html
<!-- HTML - will be highlighted and editable -->
```