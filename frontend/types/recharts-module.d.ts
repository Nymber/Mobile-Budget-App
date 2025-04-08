declare module 'recharts/lib/chart/LineChart';
declare module 'recharts/lib/cartesian/Line';
declare module 'recharts/lib/cartesian/XAxis';
declare module 'recharts/lib/cartesian/YAxis';
declare module 'recharts/lib/cartesian/CartesianGrid';
declare module 'recharts/lib/component/Tooltip';
declare module 'recharts/lib/component/Legend';

// If you need to use props in your components, you can define them like this
declare module 'recharts/lib/chart/LineChart' {
  import { FC, ReactNode } from 'react';
  interface LineChartProps {
    width?: number;
    height?: number;
    data?: Record<string, unknown>[];
    children?: ReactNode;
    [key: string]: unknown;
  }
  const LineChart: FC<LineChartProps>;
  export default LineChart;
}

declare module 'recharts/lib/cartesian/Line' {
  import { FC } from 'react';
  interface LineProps {
    type?: string;
    dataKey?: string;
    stroke?: string;
    [key: string]: unknown;
  }
  const Line: FC<LineProps>;
  export default Line;
}

declare module 'recharts/lib/cartesian/XAxis' {
  import { FC } from 'react';
  interface XAxisProps {
    dataKey?: string;
    [key: string]: unknown;
  }
  const XAxis: FC<XAxisProps>;
  export default XAxis;
}

declare module 'recharts/lib/cartesian/YAxis' {
  import { FC } from 'react';
  interface YAxisProps {
    [key: string]: unknown;
  }
  const YAxis: FC<YAxisProps>;
  export default YAxis;
}

declare module 'recharts/lib/cartesian/CartesianGrid' {
  import { FC } from 'react';
  interface CartesianGridProps {
    strokeDasharray?: string;
    [key: string]: unknown;
  }
  const CartesianGrid: FC<CartesianGridProps>;
  export default CartesianGrid;
}

declare module 'recharts/lib/component/Tooltip' {
  import { FC } from 'react';
  interface TooltipProps {
    [key: string]: unknown;
  }
  const Tooltip: FC<TooltipProps>;
  export default Tooltip;
}

declare module 'recharts/lib/component/Legend' {
  import { FC } from 'react';
  interface LegendProps {
    [key: string]: unknown;
  }
  const Legend: FC<LegendProps>;
  export default Legend;
}
