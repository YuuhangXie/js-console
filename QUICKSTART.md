# 快速开始指南

## 5分钟快速上手

### 1. 安装依赖

```bash
npm install
```

### 2. 启动应用

```bash
npm run dev
```

这个命令会同时启动：
- 前端开发服务器 (http://localhost:5173)
- 后端API服务器 (http://localhost:3000)

### 3. 打开浏览器

访问 http://localhost:5173

## 🎯 第一次使用

1. **查看示例代码**
   - 点击顶部的 "📚 示例" 按钮
   - 选择一个示例，会自动加载到编辑器

2. **编写代码**
   - 在左侧编辑器中编写 JavaScript 代码
   - 支持智能提示和语法高亮

3. **运行代码**
   - 点击 "▶ 运行" 按钮
   - 或按 `Cmd/Ctrl + Enter` 快捷键
   - 结果会显示在右侧控制台

4. **保存代码**
   - 点击 "💾 保存" 保存到浏览器本地存储
   - 下次可以点击 "📂 加载" 恢复

## 💡 常用功能

### Console API

```javascript
// 基础输出
console.log("Hello World");

// 错误信息
console.error("这是一个错误");

// 警告信息
console.warn("这是一个警告");

// 表格显示
const data = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 30 }
];
console.table(data);

// 性能计时
console.time("操作");
// ... 你的代码 ...
console.timeEnd("操作");
```

### 主题切换

点击右上角的 🌙 或 ☀️ 图标切换主题

### 清空

- "🗑️ 清空" - 清空编辑器
- "清空输出" - 清空控制台输出

## 🚫 限制说明

为了安全，以下功能被禁用：

- ❌ setTimeout / setInterval
- ❌ 网络请求（fetch, XMLHttpRequest）
- ❌ 文件系统访问
- ❌ 执行时间超过5秒会自动终止

## 📚 示例代码

### 1. 数组操作

```javascript
const numbers = [1, 2, 3, 4, 5];

// map
const doubled = numbers.map(x => x * 2);
console.log("翻倍:", doubled);

// filter
const evens = numbers.filter(x => x % 2 === 0);
console.log("偶数:", evens);

// reduce
const sum = numbers.reduce((a, b) => a + b, 0);
console.log("总和:", sum);
```

### 2. 对象和解构

```javascript
const person = {
  name: "张三",
  age: 25,
  city: "北京"
};

const { name, age } = person;
console.log(`${name}, ${age}岁`);

// 对象方法
const keys = Object.keys(person);
const values = Object.values(person);
console.log("键:", keys);
console.log("值:", values);
```

### 3. 函数和闭包

```javascript
function createCounter() {
  let count = 0;
  return {
    increment() {
      return ++count;
    },
    decrement() {
      return --count;
    },
    getCount() {
      return count;
    }
  };
}

const counter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.getCount());  // 2
```

### 4. 类和继承

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }
  
  speak() {
    console.log(`${this.name} makes a sound`);
  }
}

class Dog extends Animal {
  speak() {
    console.log(`${this.name} barks`);
  }
}

const dog = new Dog("旺财");
dog.speak();
```

### 5. Promise

```javascript
// 创建 Promise
const promise = new Promise((resolve, reject) => {
  resolve("成功!");
});

promise.then(result => {
  console.log(result);
}).catch(error => {
  console.error(error);
});

// Promise.all
const promises = [
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
];

Promise.all(promises).then(results => {
  console.log("所有结果:", results);
});
```

## 🔧 故障排除

### 问题：无法启动

**解决方案：**
1. 确保已安装 Node.js (版本 >= 16)
2. 删除 `node_modules` 文件夹
3. 重新运行 `npm install`

### 问题：端口被占用

**解决方案：**
1. 修改 `vite.config.js` 中的端口（前端）
2. 修改 `server/index.js` 中的 PORT（后端）

### 问题：代码执行超时

**解决方案：**
- 检查代码中是否有无限循环
- 减少计算量
- 移除递归调用

## 📞 获取帮助

遇到问题？
1. 查看完整的 [README.md](./README.md)
2. 查看示例代码
3. 提交 Issue

祝你使用愉快！🎉

