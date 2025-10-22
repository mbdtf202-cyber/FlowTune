import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'

const VirtualList = ({
  items = [],
  itemHeight = 100,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef(null)

  // 计算可见区域的项目
  const visibleRange = useMemo(() => {
    const containerScrollTop = scrollTop
    const startIndex = Math.max(0, Math.floor(containerScrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((containerScrollTop + containerHeight) / itemHeight) + overscan
    )
    
    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  // 计算可见项目
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange
    const visible = []
    
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        visible.push({
          index: i,
          item: items[i],
          style: {
            position: 'absolute',
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
          }
        })
      }
    }
    
    return visible
  }, [visibleRange, items, itemHeight])

  // 处理滚动事件
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop
    setScrollTop(newScrollTop)
    
    if (onScroll) {
      onScroll(e)
    }
  }, [onScroll])

  // 滚动到指定项目
  const scrollToItem = useCallback((index, align = 'auto') => {
    if (!containerRef.current) return
    
    const itemTop = index * itemHeight
    const containerScrollTop = containerRef.current.scrollTop
    const containerBottom = containerScrollTop + containerHeight
    
    let newScrollTop = containerScrollTop
    
    if (align === 'start' || itemTop < containerScrollTop) {
      newScrollTop = itemTop
    } else if (align === 'end' || itemTop + itemHeight > containerBottom) {
      newScrollTop = itemTop + itemHeight - containerHeight
    } else if (align === 'center') {
      newScrollTop = itemTop - (containerHeight - itemHeight) / 2
    }
    
    containerRef.current.scrollTop = Math.max(0, newScrollTop)
  }, [itemHeight, containerHeight])

  // 滚动到顶部
  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [])

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = items.length * itemHeight - containerHeight
    }
  }, [items.length, itemHeight, containerHeight])

  // 总高度
  const totalHeight = items.length * itemHeight

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      {...props}
    >
      {/* 虚拟容器 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 渲染可见项目 */}
        {visibleItems.map(({ index, item, style }) => (
          <div key={index} style={style}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

// 导出额外的工具函数
VirtualList.scrollToItem = (ref, index, align) => {
  if (ref.current && ref.current.scrollToItem) {
    ref.current.scrollToItem(index, align)
  }
}

VirtualList.scrollToTop = (ref) => {
  if (ref.current && ref.current.scrollToTop) {
    ref.current.scrollToTop()
  }
}

VirtualList.scrollToBottom = (ref) => {
  if (ref.current && ref.current.scrollToBottom) {
    ref.current.scrollToBottom()
  }
}

export default VirtualList