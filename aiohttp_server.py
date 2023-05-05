import asyncio
from aiohttp import web


class Server:
    ''' Simple AIOHTTP web server '''
    def __init__(self, host: str = "localhost", port: int = 8080) -> None:
        self.app_host = host
        self.app_port = port

        self.__app = None


    def __create_route_table(self) -> None:
        ''' Define all handlers 
            NOTE: Handlers defined first will be matched first (sorta FIFO) '''
        
        self.__route_table = web.RouteTableDef()
        
        # Serve static files from public folder
        self.__route_table.static("/", ".")
        
        # Define addional routes here

        # Custom 404 Handler
        @self.__route_table.route("GET", "/{key:.+}")
        async def not_found_handler(request):
            return web.Response(status=404, text="404 - Not Found")


    async def setup(self) -> None:
        ''' Configure all server components '''
        self.__create_route_table()

        self.__app = web.Application()
        self.__app.router.add_routes(self.__route_table)
        self.__app_runner = web.AppRunner(self.__app)
        await self.__app_runner.setup()


    async def start(self) -> None:
        ''' Start the server '''
        if self.__app is None: await self.setup()

        self.__site = web.TCPSite(self.__app_runner, self.app_host, self.app_port)
        await self.__site.start()


    async def run(self) -> None:
        ''' Run the server indefinately '''
        await self.start()

        while True:
            await asyncio.sleep(60)




if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    server = Server()
    
    try:
        loop.run_until_complete(server.run())
    except KeyboardInterrupt:
        loop.stop()
        loop.close()
