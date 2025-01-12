import Subtitle from "../Typography/Subtitle"

  
  function TitleCard({title, children, topMargin, TopSideButtons , title2}){
      return(
          <div className={"card w-full p-6 bg-base-100 shadow-xl " + (topMargin || "mt-6")}>

            {/* Title for Card */}
              <Subtitle styleClass={TopSideButtons ? "inline-block" : ""}>
                <div className="flex justify-between">
                  <div className="grid">
                    {title}
                    <p class="text-gray-600 text-[1.1rem] font-normal">{title2}</p>
                  </div>
                  {
                      TopSideButtons && <div className="inline-block float-right my-auto">{TopSideButtons}</div>
                  }
                </div>
              </Subtitle>
              
              <div className="divider mt-2"></div>
          
              {/** Card Body */}
              <div className='h-full w-full pb-6 bg-base-100'>
                  {children}
              </div>
          </div>
          
      )
  }
  
  
  export default TitleCard