import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './App.css';

function App() {
  const [code, setCode] = useState('// 在这里编写你的 JavaScript 代码\nconsole.log("Hello World!");\n\n// 示例：\nconst arr = [1, 2, 3, 4, 5];\nconst doubled = arr.map(x => x * 2);\nconsole.log("原数组:", arr);\nconsole.log("翻倍后:", doubled);\n');
  const [outputs, setOutputs] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState('light'); // 默认亮色主题
  const [examples, setExamples] = useState([]);
  const [showExamples, setShowExamples] = useState(false);
  const outputRef = useRef(null);
  const editorRef = useRef(null);

  // 加载示例代码
  useEffect(() => {
    fetch('/api/examples')
      .then(res => res.json())
      .then(data => setExamples(data))
      .catch(err => console.error('加载示例失败:', err));
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputs]);

  // 执行代码
  const executeCode = async () => {
    if (!code.trim()) {
      addOutput({
        type: 'error',
        content: '请输入代码',
        timestamp: Date.now()
      });
      return;
    }

    setIsRunning(true);
    
    // 添加到历史记录
    setHistory(prev => [...prev, code]);
    setHistoryIndex(-1);

    // 显示执行的代码
    addOutput({
      type: 'input',
      content: code,
      timestamp: Date.now()
    });

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.success) {
        // 显示console输出
        if (data.logs && data.logs.length > 0) {
          data.logs.forEach(log => addOutput(log));
        }

        // 显示返回值
        if (data.result !== undefined && data.result !== 'undefined') {
          addOutput({
            type: 'result',
            content: data.result,
            timestamp: Date.now()
          });
        }

        // 显示错误
        if (data.errors && data.errors.length > 0) {
          data.errors.forEach(error => addOutput(error));
        }
      } else {
        addOutput({
          type: 'error',
          content: data.error || '执行失败',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      addOutput({
        type: 'error',
        content: `网络错误: ${error.message}`,
        timestamp: Date.now()
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 添加输出
  const addOutput = (output) => {
    setOutputs(prev => [...prev, { ...output, id: Date.now() + Math.random() }]);
  };

  // 清空输出
  const clearOutput = () => {
    setOutputs([]);
  };

  // 清空编辑器
  const clearEditor = () => {
    setCode('');
    editorRef.current?.focus();
  };

  // 处理键盘快捷键
  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    
    // Cmd/Ctrl + Enter 执行代码
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      executeCode();
    });
  };

  // 切换主题
  const toggleTheme = () => {
    setTheme(prev => prev === 'vs-dark' ? 'light' : 'vs-dark');
  };

  // 加载示例代码
  const loadExample = (exampleCode) => {
    setCode(exampleCode);
    setShowExamples(false);
    editorRef.current?.focus();
  };

  // 保存代码到本地存储
  const saveCode = () => {
    try {
      localStorage.setItem('savedCode', code);
      addOutput({
        type: 'info',
        content: '✓ 代码已保存到浏览器本地存储',
        timestamp: Date.now()
      });
    } catch (error) {
      addOutput({
        type: 'error',
        content: '保存失败: ' + error.message,
        timestamp: Date.now()
      });
    }
  };

  // 加载保存的代码
  const loadSavedCode = () => {
    try {
      const savedCode = localStorage.getItem('savedCode');
      if (savedCode) {
        setCode(savedCode);
        addOutput({
          type: 'info',
          content: '✓ 已加载保存的代码',
          timestamp: Date.now()
        });
      } else {
        addOutput({
          type: 'warn',
          content: '没有找到保存的代码',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      addOutput({
        type: 'error',
        content: '加载失败: ' + error.message,
        timestamp: Date.now()
      });
    }
  };

  // 格式化输出内容
  const formatOutput = (output) => {
    if (output.type === 'input') {
      return output.content;
    }
    return output.content;
  };

  // 获取输出样式类名
  const getOutputClassName = (type) => {
    const baseClass = 'output-item';
    return `${baseClass} ${baseClass}--${type}`;
  };

  return (
    <div className={`app ${theme === 'light' ? 'app--light' : 'app--dark'}`}>
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h18v18H3V3zm16 16V5H5v14h14z" fill="currentColor"/>
              <path d="M7 7h2v2H7V7zm4 0h6v2h-6V7zm-4 4h2v2H7v-2zm4 0h6v2h-6v-2zm-4 4h10v2H7v-2z" fill="currentColor"/>
            </svg>
            <span>JavaScript 控制台</span>
          </div>
        </div>
        <div className="header-right">
          <button 
            className="btn btn--icon" 
            onClick={toggleTheme}
            title={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
          >
            {theme === 'vs-dark' ? '🌙' : '☀️'}
          </button>
          <button 
            className="btn btn--secondary" 
            onClick={() => setShowExamples(!showExamples)}
            title="查看代码示例"
          >
            📚 示例
          </button>
          <button 
            className="btn btn--secondary" 
            onClick={saveCode}
            title="保存代码到本地"
          >
            💾 保存
          </button>
          <button 
            className="btn btn--secondary" 
            onClick={loadSavedCode}
            title="加载保存的代码"
          >
            📂 加载
          </button>
          <button 
            className="btn btn--secondary" 
            onClick={clearEditor}
            title="清空编辑器"
          >
            🗑️ 清空
          </button>
          <button 
            className="btn btn--secondary" 
            onClick={clearOutput}
            title="清空输出"
          >
            清空输出
          </button>
          <button 
            className="btn btn--primary" 
            onClick={executeCode}
            disabled={isRunning}
            title="运行代码 (Cmd/Ctrl + Enter)"
          >
            {isRunning ? '运行中...' : '▶ 运行'}
          </button>
        </div>
      </header>

      {/* 示例代码面板 */}
      {showExamples && (
        <div className="examples-overlay" onClick={() => setShowExamples(false)}>
          <div className="examples-panel" onClick={(e) => e.stopPropagation()}>
            <div className="examples-header">
              <h2>代码示例</h2>
              <button className="btn btn--icon" onClick={() => setShowExamples(false)}>✕</button>
            </div>
            <div className="examples-list">
              {examples.map(example => (
                <div key={example.id} className="example-item" onClick={() => loadExample(example.code)}>
                  <div className="example-title">{example.title}</div>
                  <div className="example-description">{example.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <div className="editor-panel">
          <div className="panel-header">
            <span className="panel-title">代码编辑器</span>
            <span className="panel-hint">按 Cmd/Ctrl + Enter 执行代码</span>
          </div>
          <div className="editor-wrapper">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={code}
              onChange={setCode}
              onMount={handleEditorMount}
              theme={theme}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                renderLineHighlight: 'all',
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  useShadows: true,
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                },
                padding: { top: 16, bottom: 16 }
              }}
            />
          </div>
        </div>

        <div className="output-panel">
          <div className="panel-header">
            <span className="panel-title">控制台输出</span>
            <span className="output-count">{outputs.length} 条输出</span>
          </div>
          <div className="output-wrapper" ref={outputRef}>
            {outputs.length === 0 ? (
              <div className="output-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" opacity="0.3">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" fill="currentColor"/>
                </svg>
                <p>控制台输出将显示在这里</p>
                <p className="output-empty-hint">点击"运行"按钮或按 Cmd/Ctrl + Enter 执行代码</p>
              </div>
            ) : (
              outputs.map((output) => (
                <div key={output.id} className={getOutputClassName(output.type)}>
                  {output.type === 'input' && (
                    <div className="output-indicator">{'>'}</div>
                  )}
                  {output.type === 'result' && (
                    <div className="output-indicator output-indicator--result">{'←'}</div>
                  )}
                  {output.type === 'error' && (
                    <div className="output-indicator output-indicator--error">{'✕'}</div>
                  )}
                  {output.type === 'warn' && (
                    <div className="output-indicator output-indicator--warn">{'⚠'}</div>
                  )}
                  {output.type === 'log' && (
                    <div className="output-indicator output-indicator--log">{'ⓘ'}</div>
                  )}
                  <pre className="output-content">{formatOutput(output)}</pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-info">
          <span>💡 提示：使用 console.log()、console.error()、console.warn() 等方法输出信息</span>
        </div>
        <div className="footer-stats">
          <span>历史记录: {history.length}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;

