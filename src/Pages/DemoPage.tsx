import { useTheme } from '../hooks/useTheme'

const DemoPage = () => {
  const theme = useTheme()

  return (
    <div className="container-custom">
      <div className="text-center mb-xxl">
        <h1>Typography Demo</h1>
        <p>Fibonacci Font Scale with Theme Font Family</p>
      </div>

      <section className="mb-xxl">
        <h2>Header Hierarchy</h2>
        <p className="mb-lg">All headers follow the Fibonacci sequence: 13, 21, 34, 55, 89, 144 pixels</p>
        
        <div className="mb-xl">
          <h1>Heading 1 - {theme.typography.fontSize.h1}px</h1>
          <h2>Heading 2 - {theme.typography.fontSize.h2}px</h2>
          <h3>Heading 3 - {theme.typography.fontSize.h3}px</h3>
          <h4>Heading 4 - {theme.typography.fontSize.h4}px</h4>
          <h5>Heading 5 - {theme.typography.fontSize.h5}px</h5>
          <h6>Heading 6 - {theme.typography.fontSize.h6}px</h6>
        </div>
      </section>

      <section className="mb-xxl">
        <h3>Current Theme Configuration</h3>
        <div className="bg-white/10 p-lg rounded-sm font-mono text-sm">
          <h6>Colors:</h6>
          <p>Background: {theme.colors.background}</p>
          <p>Text: {theme.colors.text}</p>
          <p>Accent: {theme.colors.accent}</p>
          
          <h6 className="mt-md">Font Sizes (Fibonacci):</h6>
          <p>Base: {theme.typography.fontSize.base}px</p>
          <p>H6: {theme.typography.fontSize.h6}px</p>
          <p>H5: {theme.typography.fontSize.h5}px</p>
          <p>H4: {theme.typography.fontSize.h4}px</p>
          <p>H3: {theme.typography.fontSize.h3}px</p>
          <p>H2: {theme.typography.fontSize.h2}px</p>
          <p>H1: {theme.typography.fontSize.h1}px</p>
        </div>
      </section>

      <section className="mb-xxl">
        <h4>Sample Content</h4>
        <p>
          This is a paragraph of body text using the base font size of {theme.typography.fontSize.base}px. 
          The theme font family provides excellent readability and a modern appearance. 
          You can easily modify the theme by editing the <code className="bg-white/20 px-1 rounded">theme.json</code> file.
        </p>
        
        <h5>Interactive Elements</h5>
        <p>Here are some interactive elements styled with our theme:</p>
        <div className="flex items-center gap-md">
          <button>Primary Button</button>
          <a href="#" className="ml-md">Sample Link</a>
        </div>
      </section>

      <section>
        <h5>How to Customize</h5>
        <p>
          To change the theme, simply edit the <code className="bg-white/20 px-1 rounded">theme.json</code> file in your project root:
        </p>
        <ul className="pl-lg mb-md list-disc">
          <li>Change <code className="bg-white/20 px-1 rounded">colors.background</code> to modify the background color</li>
          <li>Adjust font sizes in <code className="bg-white/20 px-1 rounded">typography.fontSize</code></li>
          <li>Modify spacing values in the <code className="bg-white/20 px-1 rounded">spacing</code> object</li>
          <li>Update font weights in <code className="bg-white/20 px-1 rounded">typography.fontWeight</code></li>
        </ul>
        <p>
          The changes will be automatically applied when you save the file and the page refreshes.
        </p>
      </section>
    </div>
  )
}

export default DemoPage