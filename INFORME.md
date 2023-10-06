# TP1 - Informe

<div align="center">

 LOAD BALANCERS
  
|     Nombre          |  Padrón  |
|:-------------------:|:-------:|
|   German Rotili     |  99722  |
|   Cristian Lin      | 107825  |
| Roberto Marcos Riarte|  84714  |
|   Gabriel Katta     | 105935  |

</div>

## Objetivo

El objetivo del proyecto es implementar un servicio Node que consume servicios externos para comparar distintas estrategias/tecnologias y como estas impactan el los atributos de calidad.

## Tutorial de uso del servicio

Copiar el .env.example al .env para poder levantar el servicio.

Para levantar el servicio hay que ubicarse en la raiz del proyecto y ejecutar el comando:

```
bash start_app.bash
```

De necesitar usar sudo para correr docker-compose se puede usar el comando:

```
sudo docker-compose build
sudo docker-compose up -d
```

Para probar que el servicio esta levantado se puede usar el comando:

```
curl localhost:5555/ping
```

## Estrategias
Cada estrategia esta en una rama distinta, en la rama main estan todas las implementaciones juntas.
### Caso Base
El caso base se usa como metrica contra la cual vamos a comparar las distintas estrategias. 
### Caso replicacion
El caso replicacion incrementa la cantidad de web-servers que se van a usar, usando a nginx como load-balancer. Al tener la carga separada el impacto de procesamiento interno (del lado del web-server) deberia tener un menor impacto que en el caso base. Si la limitante en cuanto a performance son las APIs externas no deberia haber mucha mejora.
### Caso Cache
En el caso cache se utiliza un servicio de almacenamiento REDIS y tecnicas de almacenamiento en memoria para guardar temporalmente los pedidos a las APIs externas, haciendo uso de tecnicas de cache como el active y lazy population dependiendo de el caso y las caracteristicas de la información consultada. Al cachear los datos obtenidos de las APIs externas el impacto en la performance de estas deberia ser mucho menor, si fuera que estas nos limitan, deberia haber una mejora grande en performance.
### Caso Rate-Limit
En el caso del rate-limit se decidió implementar mediante el uso de la libreria "express-rate-limit", alternativamente se podria haber usado la misma feature a traves de nginx. lo que nos permite esta capabilidad es controlar la frecuencia con la cual los usuarios acceden a nuestras funcionalidades, evitando asi alguna saturación impuesta de parte de los componentes externos que se usan en la app.
## Conectores y Servicios
> NOTA: el diagrama muestra una conexion HTTP entre graphite y el webserver, esto no es asi, se comunica con Statsd
### Caso Base
En el caso base el servicio esta conformado por un Reverse Proxy (nginx) que dirige los pedidos del cliente al web server (node) que a su vez hace pedidos a APIs externas (metar, quote, spaceflight news). Se obtienen metricas de uso usando Graphite.
![Caso_base.png](files%2Fcomponents%2FCaso_base.png)
### Caso Replicacion
En el caso de la replicacion el web server esta replicado en varias instancias, en este caso el Reverse Proxy funciona como load balancer, usando la estrategia round-robin para dirigir la carga.
![Replicacion.png](files%2Fcomponents%2FReplicacion.png)
### Caso Cache
En el caso de cache se agrega una cache (Redis) para reducir los pedidos a las APIs externas.
![Cache.png](files%2Fcomponents%2FCache.png)
### Caso Rate-Limit
En el caso del rate-limit se configura un rate limit en el web-server, esto limita la cantidad de pedidos que puede ahcer un cliente.
![Rate_limit.jpeg](files%2Fcomponents%2FRate_limit.jpeg)
> NOTA: el rate-limit esta en el servicio de Node no en el Nginx
## Escenarios

Para las distintas estrategias implementadas se sometieron a las APIs a la siguiente prueba de carga genérica de requests (mediante Artillery), de esta manera poder obtener un comportamiento de control y comparable entre las diversas estrategias.

```yaml
  phases:
    - name: Ramp [1]
      duration: 20
      arrivalRate: 10
      rampTo: 30
    - name: Plain [1]
      duration: 45
      arrivalRate: 30
    - name: Spike [1]
      duration: 30
      arrivalRate: 70
    - name: Plain [2]
      duration: 45
      arrivalRate: 50
    - name: Ramp [2]
      duration: 20
      arrivalRate: 50
      rampTo: 25
    - name: Spike [2]
      duration: 20
      arrivalRate: 150
    - name: Plain [3]
      duration: 30
      arrivalRate: 120
    - name: Spike [3]
      duration: 45
      arrivalRate: 350
    - name: Ramp [Shutdown 1]
      duration: 20
      arrivalRate: 350
      rampTo: 5
    - name: Ramp [Shutdown 2]
      duration: 10
      arrivalRate: 5
      rampTo: 0
```

> Recordatorio: Estos casos de prueba se encuentran en la carpeta perf, y pueden ser lanzados mediante el script de bash encontrado en dicha carpeta. Ademas de ser necesario se debe lanzar el comando "npm i" para instalar el plugin de Artillery.

### Caso Base
#### Quote
![quote_1.png](files%2Fbase%2FQuote%2Fquote_1.png)
![quote_2.png](files%2Fbase%2FQuote%2Fquote_2.png)

> Es evidente que este caso de prueba demuestra una gran cantidad de request que fueron respondidas mediante 429 "Too Many Requests". Esto era de esperarse ya que la API de Quotable establece en su documentación un rate-limiting de 180 requests por minuto, por ende nuestro escenario de Artillery  le pega de manera agresiva a la API, siendo esta el factor limitante a nivel de capacidad para responder a una carga elevada de requests.

> Mas allá de lo anterior, observamos tiempos de respuestas de la API externa bastante estables, aun asi cuando principalmente responde esos 429. Con respecto a nuestro propio endpoint vemos que este no varia y mantiene una media de al rededor de los 500ms.

> Hipótesis: Replicación no seria particularmente beneficioso en este caso, ya que la cantidad de requests por minuto para la API seria la misma, rate-limit solo seria beneficioso si se implementa uno que se apegue a lo esperado por la API (180RPM), por ende el casos de cache podria llegar a ser el mejor ya que reduciriamos fuertemente las llamadas externas.


#### Metar
![metar_1.png](files%2Fbase%2FMetar%2Fmetar_1.png)
![metar_2.png](files%2Fbase%2FMetar%2Fmetar_2.png)


> La API de METAR arranca nuestro caso de prueba de manera bastante solida, el unico response code distinto de 200 es 404 lo cual es de esperarse para la seleccion al azar de codigos que elegimos.

> El tiempo de respuesta de la API externa es bastante estable hasta llegar a la ultima fase de la prueba, en donde vemos que empieza a deteriorarse, sin embargo esta subida de tiempo es algo que notamos que persiste en todas las pruebas que hagamos asi que creemos que algo esta mal en la manera que medimos el tiempo.

> Con respecto al tiempo de respuesta de nuestra propia API, su deterioro es consistente con el aumento fuerte de RPM en el ultimo tercio de la prueba, es aqui en donde empezamos a recibir ETIMEDOUT ya que Artillery empiza a notar que tardamos en responder.

> Hipotesis: Para tratar los ETIMEDOUT que son de origen de nuestro servidor, el caso de replicacion nos ayudaria para hacer una distribucion de la carga mas uniforme y mantener disponibilidad, sin embargo la cantidad de llamadas a la API seria la misma, asi que no evitaria los 403 que eventualmente nos devolvera para limitarnos. La cache claramente ayudaria a saltarnos el 403 y tambien reducir los ETIMEDOUT ya que no nos veriamos afectados por el deterioro de la API. Rate-limit nos ayudaria a evitar los 403 pero estariamos sacrificando a cuantos usuarios somos capaces de responderle.

#### Spaceflight News
![space_1.png](files%2Fbase%2FSpace%2Fspace_1.png)
![space_2.png](files%2Fbase%2FSpace%2Fspace_2.png)


> Se observa una resiliciencia de parte del endpoint durante la mayoria de la prueba, el tiempo de respuesta de la API Externa es alto pero consistente, sin embargo al momento de llegar a la fase final, este empieza a deteriorarse afectando negativamente el procesamiento de la app interna, ademas vemos algunos errores 500 lo que indica que tambien se ve unas fallas del lado API Externa.

> Hipotesis: Si replicamos no evitariamos el deterioro de la API Externa pero si nos podria ayudar a evitar algunos ETIMEDOUT al quedar mejor distribuida la carga, una cache sigue siendo la mejor opcion a simple vista para evitar sobrecargar la API Externa.

### Caso Replicacion
#### Quote
![quote_rep_1.png](files%2Freplicacion%2FQuote%2Fquote_rep_1.png)
![quote_rep_2.png](files%2Freplicacion%2FQuote%2Fquote_rep_2.png)

> Como era de esperarse, al tener 3 replicas la cantidad de API Calls siguen siendo las mismas, por lo cual nos encontraremos limitados por la mayor parte de toda la prueba. No se ven mejoras significativas en tiempos de respuestas de la API Externa.

#### Metar
![metar_rep_1.png](files%2Freplicacion%2FMetar%2Fmetar_rep_1.png)
![metar_rep_2.png](files%2Freplicacion%2FMetar%2Fmetar_rep_2.png)

> En comparacion al caso base, vemos que haber replicado nuestro servidor disminuyo significativamente los TIMEOUTs internos de la aplicacion, sin embargo no se observa ni una mejora significativa en los tiempos de respuesta de la API Externa (lo cual tiene sentido, mismas api calls) ni la disponibilidad de la misma (Siguen habiendo 403).

#### Spaceflight News
![space_rep_1.png](files%2Freplicacion%2FSpace%2Fspace_rep_1.png)
![space_rep_2.png](files%2Freplicacion%2FSpace%2Fspace_rep_2.png)

> En este caso si observamos una mejora con respecto a los TIMEDOUT causados por el pico de trafico, sin embargo aun persisten, esto quizas ya que la API sigue teniendo tiempos de respuesta bastante elevados al empezar a ser saturada, causando que para Artillery tengamos algunas requests que siguen pasandose de tiempo.

### Caso Rate-Limit
- Para la implentacion de este caso, se decidio ir con un rate-limit de 500 requests en una ventana de 5 segundos. (O el equivalente a 100 requests por segundo).

#### Quote
![quote_limit_1.png](files%2Flimite%2FQuote%2Fquote_limit_1.png)
![quote_limit_2.png](files%2Flimite%2FQuote%2Fquote_limit_2.png)

> Para el caso de las quotes, vemos que aun asi esta en efecto nuestro propio rate limit, no ibamos a llegar a una mejora sin aplicar un rate-limit igual o mas agresivo que el de la APIde Quotable. Es decir al menos un rate-limit de 3 requests por segundo. Para conservar la igualdad de las pruebas obviamos este caso.

#### Metar
![metar_limit_1.png](files%2Flimite%2FMetar%2Fmetar_limit_1.png)
![metar_limit_2.png](files%2Flimite%2FMetar%2Fmetar_limit_2.png)

> En el caso de Metar, observamos que desaparecen por completo los 403, esto tiene sentido, ya que evitamos saturar la API Externa, lo cual por consiguiente nos permitio a nuestra API no saturar su tiempo de respuesta en el ultimo tercio como en el caso base.

#### Spaceflight News
![space_limit_1.png](files%2Flimite%2FSpace%2Fspace_limit_1.png)
![space_limit_2.png](files%2Flimite%2FSpace%2Fspace_limit_2.png)

> Nuevamente el rate-limit logra evitar saturar la API de spaceflight, y consecuentemente el de nosotros. Nos deshacemos por completo de los 500 al costo de responder a mas usuarios con el 429, afectando nuestra disponibilidad para dar respuestas.

### Caso Cache
#### Quote
![quote_cache_1.png](files%2Fcache%2FQuote%2Fquote_cache_1.png)
![quote_cache_2.png](files%2Fcache%2FQuote%2Fquote_cache_2.png)

> Para el caso de las Quotes, se decidio no usar el REDIS, y optar mejor por una opcion in-memory, esto permitiendonos ahorrar el overhead y operaciones extra que debemos hacer para parsear la data guardada. Ademas, al ser quotes random y preferiblemente no repetidas, se opto por hace una variacion de la Active Population la cual consiste en guardarnos 50 quotes en una sola API call (cosa que permite la Api de Quotable) y mientras tengamos quotes en nuestra cache saltarnos el paso de ejecutar una llamada.

> Aca se puede apreciar como la cache beneficia a la aplicacion y API de diversas maneras, primero que todo podemos observar que lastimosamente sigue aplicando el rate-limit de la API, esto ya que al solo cachearnos 50 quotes estas se acaban bastante rapido lo cual no nos evita tener que llamar. (Siempre se podria subir ese numero arbitrario de 50 a muchas mas...)

> El response time de la aplicacion es minimo gracias a la cache, alcanzando su maximo eventualmente cuando necesite recopilar otras 50 quotes.

#### Metar
![metar_cache_1.png](files%2Fcache%2FMetar%2Fmetar_cache_1.png)
![metar_cache_2.png](files%2Fcache%2FMetar%2Fmetar_cache_2.png)

> Para la API de Metar, implementamos una estrategia de "Lazy Population" que almacena el METAR durante 5 segundos para cualquier código que NO esté presente en el REDIS.

> En comparación con el escenario base, la caché logró que evitáramos por completo los errores de "ETIMEDOUT" y los límites de velocidad ("rate-limit" 403) impuestos por la API externa.

> El tiempo de respuesta de nuestro punto de acceso se mantuvo nuevamente en niveles muy bajos gracias a la caché, mientras que el tiempo de respuesta de la API externa solo experimenta picos ocasionales cuando necesita refrescar la caché.

#### Spaceflight News
![space_cache_1.png](files%2Fcache%2FSpace%2Fspace_cache_1.png)
![space_cache_2.png](files%2Fcache%2FSpace%2Fspace_cache_2.png)

> Para la API de Spaceflight, hemos optado una vez más por la estrategia de "Lazy Population" para almacenar las últimas 5 noticias durante 10 segundos.

> Una vez más, hemos logrado eliminar completamente los errores de "ETIMEDOUT" y los códigos de error "500" que experimentábamos en el caso base, gracias a la drástica reducción en el número de llamadas a la API. El tiempo de respuesta de nuestro punto de acceso es mínimo, y evitamos sobrecargar la API de Spaceflight con llamadas redundantes que, durante el tiempo de ejecución, es poco probable que cambien su respuesta.

## Conclusiones

En comparación con el escenario base, cada una de las estrategias presenta beneficios notables. Sin embargo, la elección depende en gran medida de los atributos de calidad que se valoren más en el caso específico.

En el caso del "rate-limiting," esta táctica contribuye significativamente a evitar la saturación de los servicios externos de nuestra aplicación y, por ende, a mantener su disponibilidad. Sin embargo, este logro viene acompañado del sacrificio de una porción sustancial de usuarios a quienes se les podría denegar el acceso.

Por otro lado, la replicación mediante una cuidadosa distribución de solicitudes permite que nuestra aplicación responda de manera robusta a cargas masivas de peticiones y a las operaciones internas asociadas a ellas. No obstante, los servicios externos siguen experimentando la misma carga. Vale la pena señalar que, dado que todas las solicitudes provienen de la misma máquina, los servicios externos aún las perciben como originadas desde una única IP, lo que podría limitarnos más de lo deseado en comparación con el uso de una infraestructura física, como otra máquina, que podría arrojar resultados más favorables.

Por último, pero no menos importante, la estrategia de almacenamiento en caché arrojó resultados sobresalientes. Además de mantener tiempos de respuesta extremadamente bajos, esta técnica evita que las APIs externas se saturen con solicitudes redundantes. El único momento en que esta técnica se ve comprometida es durante los breves periodos de actualización, que pueden generar picos en los tiempos de respuesta.