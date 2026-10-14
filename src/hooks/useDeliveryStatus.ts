import {useEffect,useState} from 'react';
import {deliveryStatus,type DeliveryStatus} from '../services/onlineEnquiries';
export default function useDeliveryStatus(){const [status,setStatus]=useState<DeliveryStatus>({enabled:false});const [checking,setChecking]=useState(true);useEffect(()=>{let active=true;void deliveryStatus().then(v=>{if(active){setStatus(v);setChecking(false);}});return()=>{active=false;};},[]);return {status,checking};}
