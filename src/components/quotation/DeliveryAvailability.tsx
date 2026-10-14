export default function DeliveryAvailability({enabled,checking=false}:{enabled:boolean;checking?:boolean}){
 if(enabled)return null;
 return <div className="delivery-availability" role="status"><p>{checking?'Checking online enquiry availability…':'Online enquiry and quotation submissions are temporarily unavailable. Please contact the bakery directly.'}</p><a className="text-link" href="mailto:guguminnaar@gmail.com">Email the bakery</a> <a className="text-link" href="tel:+27731268382">Call 073 126 8382</a></div>;
}
