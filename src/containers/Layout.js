import PageContent from "./PageContent"
import LeftSidebar from "./LeftSidebar"
import { useSelector, useDispatch } from 'react-redux'
import RightSidebar from './RightSidebar'
import { useEffect } from "react"
import  {  removeNotificationMessage } from "../features/common/headerSlice"
import {NotificationContainer, NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import ModalLayout from "./ModalLayout"
import Customer from "../features/Customer/Customer"

function Layout(){
    return(
      <>
        
        <Customer />

      </>
    )
}

export default Layout