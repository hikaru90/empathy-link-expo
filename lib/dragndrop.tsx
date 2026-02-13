import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Animated, LayoutRectangle, Platform, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

export interface DragndropData {
  itemText: string;
  correctBucket: 'A' | 'B';
}

interface DropZone {
  getRect: () => { x: number; y: number; width: number; height: number } | null;
  onDrop: (data: DragndropData) => void;
  refreshRect?: () => void;
}

interface DragndropContextType {
  data?: DragndropData;
  pos: { x: Animated.Value; y: Animated.Value };
  dragging: boolean;
  onDragStart: (data: DragndropData) => void;
  onDragEnd: (pos: { x: number; y: number }) => void;
  registerDropZone: (id: string, zone: DropZone) => void;
  unregisterDropZone: (id: string) => void;
}

const DragndropContext = createContext<DragndropContextType>({} as DragndropContextType);

export const useDragndrop = () => useContext(DragndropContext);

export const DragndropContextProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<DragndropData>();
  const [dragging, setDragging] = useState(false);
  const pos = useRef({ x: new Animated.Value(0), y: new Animated.Value(0) }).current;
  const dropZonesRef = useRef<Map<string, DropZone>>(new Map());

  const registerDropZone = useCallback((id: string, zone: DropZone) => {
    dropZonesRef.current.set(id, zone);
  }, []);

  const unregisterDropZone = useCallback((id: string) => {
    dropZonesRef.current.delete(id);
  }, []);

  const onDragStart = useCallback((d: DragndropData) => {
    setData(d);
    setDragging(true);
    for (const [, zone] of dropZonesRef.current) {
      zone.refreshRect?.();
    }
  }, []);

  const onDragEnd = useCallback((p: { x: number; y: number }) => {
    setDragging(false);
    if (!data) return;

    for (const [, zone] of dropZonesRef.current) {
      const rect = zone.getRect();
      if (!rect) continue;
      const { x, y, width, height } = rect;
      if (p.x >= x && p.x <= x + width && p.y >= y && p.y <= y + height) {
        zone.onDrop(data);
        break;
      }
    }
  }, [data]);

  const value: DragndropContextType = {
    data,
    pos,
    dragging,
    onDragStart,
    onDragEnd,
    registerDropZone,
    unregisterDropZone,
  };

  return (
    <DragndropContext.Provider value={value}>{children}</DragndropContext.Provider>
  );
};

export const DragndropStartPoint = ({
  children,
  data,
  onTap,
}: {
  children: ReactNode;
  data: DragndropData;
  onTap?: () => void;
}) => {
  const { pos, onDragStart, onDragEnd } = useDragndrop();

  const panGesture = Gesture.Pan()
    .minDistance(8)
    .onStart(() => {
      onDragStart(data);
    })
    .onUpdate((evt) => {
      pos.x.setValue(evt.absoluteX);
      pos.y.setValue(evt.absoluteY);
    })
    .onEnd((evt) => {
      onDragEnd({ x: evt.absoluteX, y: evt.absoluteY });
    })
    .runOnJS(true);

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      onTap?.();
    })
    .runOnJS(true);

  const gesture = onTap
    ? Gesture.Exclusive(panGesture, tapGesture)
    : panGesture;

  return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
};

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

let dropZoneIdCounter = 0;

export const DragndropEndPoint = ({
  children,
  onDrop,
  style,
  zoneId: providedZoneId,
  testID,
}: {
  children: ReactNode;
  onDrop?: (data: DragndropData) => void;
  style?: any;
  zoneId?: string;
  testID?: string;
}) => {
  const { registerDropZone, unregisterDropZone } = useDragndrop();
  const ref = useRef<any>(null);
  const rectRef = useRef<Rect | null>(null);
  const zoneIdRef = useRef(providedZoneId ?? `dropzone-${++dropZoneIdCounter}`);
  const zoneId = zoneIdRef.current;

  const updateRect = useCallback(() => {
    ref.current?.measureInWindow(
      (x: number, y: number, width: number, height: number) => {
        rectRef.current = { x, y, width, height };
      }
    );
  }, []);

  React.useEffect(() => {
    if (!onDrop) return;
    registerDropZone(zoneId, {
      getRect: () => rectRef.current,
      onDrop,
      refreshRect: updateRect,
    });
    return () => unregisterDropZone(zoneId);
  }, [zoneId, onDrop, registerDropZone, unregisterDropZone, updateRect]);

  React.useEffect(() => {
    updateRect();
  }, [updateRect]);

  return (
    <View ref={ref} onLayout={updateRect} collapsable={false} style={style} testID={testID}>
      {children}
    </View>
  );
};

export const DragndropDragContent = ({
  children,
  renderContent,
}: {
  children?: ReactNode;
  renderContent?: (data: DragndropData) => ReactNode;
}) => {
  const { pos, dragging, data } = useDragndrop();
  const [contentLayout, setContentLayout] = useState<LayoutRectangle>();

  if (!dragging || !data) return null;

  const content = renderContent ? renderContent(data) : children;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          left: pos.x,
          top: pos.y,
          zIndex: 1000,
        },
        Platform.OS === 'web'
          ? { position: 'fixed' as const }
          : { position: 'absolute' as const },
      ]}
    >
      <Animated.View
        onLayout={(evt) => setContentLayout(evt.nativeEvent.layout)}
        style={{
          transform: [
            { translateX: -((contentLayout?.width ?? 0) / 2) },
            { translateY: -((contentLayout?.height ?? 0) / 2) },
          ],
        }}
      >
        {content}
      </Animated.View>
    </Animated.View>
  );
};
