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

### Caso Base
El caso base se usa como metrica contra la cual vamos a comparar las distintas estrategias. 
### Caso replicacion
El caso replicacion incrementa la cantidad de web-servers que se van a usar, usando a nginx como load-balancer. Al tener la carga separada el impacto de procesamiento interno (del lado del web-server) deberia tener un menor impacto que en el caso base. Si la limitante en cuanto a performance son las APIs externas no deberia haber mucha mejora.
### Caso Cache
En el caso cache se utiliza un servicio de almacenamiento REDIS y tecnicas de almacenamiento en memoria para guardar temporalmente los pedidos a las APIs externas, haciendo uso de tecnicas de cache como el active y lazy population dependiendo de el caso y las caracteristicas de la información consultada. Al cachear los datos obtenidos de las APIs externas el impacto en la performance de estas deberia ser mucho menor, si fuera que estas nos limitan, deberia haber una mejora grande en performance.
### Caso Rate-Limit
En el caso del rate-limit se decidió implementar mediante el uso de la libreria "express-rate-limit", alternativamente se podria haber usado la misma feature a traves de nginx. lo que nos permite esta capabilidad es controlar la frecuencia con la cual los usuarios acceden a nuestras funcionalidades, evitando asi alguna saturación impuesta de parte de los componentes externos que se usan en la app.
## Conectores y Servicios

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
![Rate_limit.png](files%2Fcomponents%2FRate_limit.png)

## Escenarios

Para las distintas estrategias implementadas se sometieron a las APIs a la siguiente prueba de carga genérica de requests (mediante Artillery), de esta manera poder obtener un comportamiento de control y comparable entre las diversas estrategias.

```yaml
  phases:
    - name: Ramp [1]
      duration: 30
      arrivalRate: 5
      rampTo: 50
    - name: Plain [1]
      duration: 60
      arrivalRate: 50
    - name: Ramp [2]
      duration: 30
      arrivalRate: 50
      rampTo: 100
    - name: Plain [2]
      duration: 60
      arrivalRate: 100
    - name: Spike [1]
      duration: 25
      arrivalRate: 200
    - name: Plain [3]
      duration: 60
      arrivalRate: 150
    - name: Ramp [Shutdown]
      duration: 30
      arrivalRate: 150
      rampTo: 0
```

> Recordatorio: Estos casos de prueba se encuentran en la carpeta perf, y pueden ser lanzados mediante el script de bash encontrado en dicha carpeta. Ademas de ser necesario se debe lanzar el comando "npm i" para instalar el plugin de Artillery.

## Caso Base

#### Quote
![quote_1.png](files%2Fbase%2FQuote%2Fquote_1.png)
![quote_2.png](files%2Fbase%2FQuote%2Fquote_2.png)

### Observaciones
> Es evidente que este caso de prueba demuestra una gran cantidad de request que fueron respondidas mediante 429 "Too Many Requests". Esto era de esperarse ya que la API de Quotable establece en su documentación un rate-limiting de 180 requests por minuto, por ende nuestro escenario de Artillery  le pega de manera agresiva a la API. Entonces el factor limitante en este caso viene siendo la API de Quotable, es decir, es esperable que una tecnica que disminuya la frecuencia con la que se hacen las API Calls ayudaria a que mejore la disponibilidad.


#### Metar
![metar_1.png](files%2Fbase%2FMetar%2Fmetar_1.png)
![metar_2.png](files%2Fbase%2FMetar%2Fmetar_2.png)
#### Spaceflight News
![space_1.png](files%2Fbase%2FSpace%2Fspace_1.png)
![space_2.png](files%2Fbase%2FSpace%2Fspace_2.png)
### Caso Replicacion

#### Quote
![quote_rep_1.png](files%2Freplicacion%2FQuote%2Fquote_rep_1.png)
![quote_rep_2.png](files%2Freplicacion%2FQuote%2Fquote_rep_2.png)
#### Metar
![metar_rep_1.png](files%2Freplicacion%2FMetar%2Fmetar_rep_1.png)
![metar_rep_2.png](files%2Freplicacion%2FMetar%2Fmetar_rep_2.png)
#### Spaceflight News
![space_rep_1.png](files%2Freplicacion%2FSpace%2Fspace_rep_1.png)
![space_rep_2.png](files%2Freplicacion%2FSpace%2Fspace_rep_2.png)
## Caso Cache

#### Quote
![quote_cache_1.png](files%2Fcache%2FQuote%2Fquote_cache_1.png)
![quote_cache_2.png](files%2Fcache%2FQuote%2Fquote_cache_2.png)
#### Metar
![metar_cache_1.png](files%2Fcache%2FMetar%2Fmetar_cache_1.png)
![metar_cache_2.png](files%2Fcache%2FMetar%2Fmetar_cache_2.png)
#### Spaceflight News
![space_cache_1.png](files%2Fcache%2FSpace%2Fspace_cache_1.png)
![space_cache_2.png](files%2Fcache%2FSpace%2Fspace_cache_2.png)
## Caso Rate-Limit

#### Quote
![quote_limit_1.png](files%2Flimite%2FQuote%2Fquote_limit_1.png)
![quote_limit_2.png](files%2Flimite%2FQuote%2Fquote_limit_2.png)
#### Metar
![metar_limit_1.png](files%2Flimite%2FMetar%2Fmetar_limit_1.png)
![metar_limit_2.png](files%2Flimite%2FMetar%2Fmetar_limit_2.png)
#### Spaceflight News
![space_limit_1.png](files%2Flimite%2FSpace%2Fspace_limit_1.png)
![space_limit_2.png](files%2Flimite%2FSpace%2Fspace_limit_2.png)