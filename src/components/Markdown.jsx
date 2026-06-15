import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function ImmersiveImage({ src, alt, title }) {
  return (
    <div className="immersive-break">
      <img src={src} alt={alt} />
      {title ? (
        <div className="break-overlay">
          <h3>{title}</h3>
        </div>
      ) : null}
    </div>
  )
}

// Unwrap paragraphs whose only child is an image so the block-level
// .immersive-break div is not rendered inside a <p> (invalid HTML).
function Paragraph({ node, children }) {
  if (node?.children?.length === 1 && node.children[0].tagName === 'img') {
    return <>{children}</>
  }
  return <p>{children}</p>
}

export default function Markdown({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{ img: ImmersiveImage, p: Paragraph }}
    >
      {children}
    </ReactMarkdown>
  )
}
