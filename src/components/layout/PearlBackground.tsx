import '../../styles/pearls.css';

export default function PearlBackground() {
  return <div className="pearl-background" aria-hidden="true">
    {Array.from({length:12},(_,index)=><span className="decorative-pearl" key={index}/>)}
  </div>;
}
