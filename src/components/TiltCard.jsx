import { useRef } from 'react';
export default function TiltCard({ className='', children }){
  const ref = useRef(null);
  const move = (e)=>{
    const el = ref.current; if(!el) return;
    const r = el.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
    el.style.transform=`perspective(700px) rotateX(${-y*6}deg) rotateY(${x*6}deg) translateZ(6px)`;
  };
  const reset = ()=>{ if(ref.current) ref.current.style.transform=''; };
  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={reset} className={`tilt glass ${className}`}>
      {children}
    </div>
  );
}
