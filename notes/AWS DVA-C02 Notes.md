**AWS Developer Associate (DVA-C02) \- Exam Notes**

## **Compute** 

EC2

* EC2 instances can be launched from Amazon Machine Images (**AMI**)   
- These include a definition for the OS and any custom configurations for your server  
- They are provided by AWS, by third-party vendors via the AWS marketplace, community developed, or you can define your own custom AMIs.  
- AMIs play a crucial role in implementing auto-scaling.   
* Instance types  
- General purpose \- balanced mix of CPU, network, and storage. Ideal for small to medium databases, test environments, or web servers.  
- Compute optimised \- focused on compute power, ideal for batch processing or machine learning.  
- Memory optimised \- ideal for large scale in memory apps and processing of unstructured data  
- Storage optimised \- enhanced storage using SSD and provision of high IOPS, good for data file systems  
- HPC optimised \- ideal for high performance computing workflows  
* Instance purchasing options  
- On-demand   
  - Launch any time, available within minutes.  
  - Pay a flat hourly rate based on the instance type  
  - Best suited for irregular, short term, or uninterruptible workloads.  
  - On-demand capacity reservation allows you to reserve capacity in an AZ for any length of time.  
- Spot   
  - Leverage unused capacity at a discounted price. Charged at a variable hourly rate based on supply/demand.   
  - Workloads can be halted by AWS without warning, hence these are only suitable for jobs which can tolerate interruptions  
- Reserved  
  - Purchase compute power upfront, with discounts based on the amount of deposit paid.   
  - Offering classes provided include Standard, which allows you to change the AZ or size of the instance post-creation but cannot be exchanged for a different instance, and can be bought and sold on the AWS reserved instances marketplace, and Convertible which are pricier but more flexible and cannot be traded on the AWS marketplace.   
* Tenancy families   
- Shared \- default option, runs on the first available host that matches the build requirements.  
- Dedicated Instances \- hosted on hardware dedicated to one customer   
- Dedicated hosts \- offer more visibility and customisability of the underlying configurations that dedicated instances   
* Storage options  
- Persistent \- available via EBS columns attachable via network to the instance. EBS volume can be associated and dissociated to instances, and support point-in-time snapshots saved to S3. Encryption of stored data and snapshots is also supported.  
- Ephemeral (temporary) \- created by EC2 using local storage. Once the instance stops, terminates, or hibernates then the data is lost unless the instance is rebooted. Since the storage is physically attached to the instance, this option is quicker but more volatile.   
* Security   
- An instance should be associated with a security group, which is an instance-level firewall for controlling traffic to and from the instance.  
- An encryption key-pair should also be used to encrypt data. The public key is used for encryption and is AWS managed, while the private key is used for decryption or SSH tunnelling and is user-managed. The same key-pair can be used for multiple instances. 

EC2 Auto-Scaling

* Used to scale a fleet of instances within an auto-scaling group based on pre-configured metrics such as CPU usage  
* To create an EC2 autoscaling group  
1. Create a launch configuration or launch template to define how the auto scaling group should build new EC2 instances according to the provided AMI.  
2. Create an auto-scaling group to define the desired state of the group based on scaling policy and location (AZ) where the resources should be placed.   
* Auto-scaling families  
- Manual \- more flexible and suited for one-off predictable events. Not scalable due to human involvement.   
- Scheduled \- time-based scaling. Saves more money when combined with spot instances.   
- Dynamic   
  - Scaling down is based on certain metrics tracked across the scaling group. This policy will scale the group to keep the tracked values within certain boundaries.  
  - A cooldown policy is used to avoid over or under scaling, done using a Cloudwatch alarm which is triggered when a metric boundary is reached. Note that when this policy is deleted, so are the alarms associated with it.   
  - Best practice is to scale up aggressively and scale down quickly, since killing instances is quicker than creating new ones.   
- Predictive   
  - Uses ML to predict load spikes learned from Cloudwatch data between 1-14 days old.  
  - Best suited for cyclical or recurring workloads.  
  - Provides a prediction-mode only to observe how predictions would behave in the real world, with an option to switch to “forecast \+ scale” to scale once per hour.   
  - Using predictive and dynamic autoscaling together could be better for a real-time feel.

Elastic Beanstalk

* A managed service where users upload application and configuration code, and Beanstalk automatically provisions the required resources to make the web application operational.   
* Ideal for engineering teams with limited time or experience  
* The service itself is free, however developers only pay for the resources deployed to implement the configuration.  
* Core components  
  * Application version \- references a section of deployable code  
  * Environment  \- app version deployed on AWS, and compromised of all the resources created.  
  * Env. config \- how an environment will deploy its resources  
  * Env tier \- how Beanstalk provisions resources based on the application requirements  
- Web server environment \- ideal for http request processing (uses AWS services such as route 53, ELB, auto scaling group, EC2 instances, security group)  
- Worker environment \- ideal for consuming from an SQS queue (uses AWS services such as SQS,  auto scaling, IAM service role , EC2 instances)  
  * Config templates \- the baseline for creating a new environment configuration   
  * Platform \- components of Beanstalk itself, such as OS, server type, etc.  
  * Applications \- collection of different elements which can have multiple application versions.  
* Deployment options  
  * All at once \- default option, rolls out application resource all at once  
  * Rolling \- resources are deployed in batches  
  * Rolling with additional batch \- add another batch of instances to the environment for maximum availability  
  * Immutable \- creates a new set of instances served via a temporary auto-scaling group behind an ELB. Once the deployment is complete, the environment will be removed and the auto-scaling group is updated to be associated with the newly deployed instances.  
* Monitoring and Health checks   
- Basic \- by default, the resources deployed send metrics to CloudWatch every 5 minutes.  
- For web environments containing an ELB, health checks are performed by the ELB every 10 seconds.   
- For worker environments, the health status is determined by EC2 status checks (on instance or host)  
- Advanced \- AMIs in worker environments have a health agent installed for deeper and more frequent monitoring, which sends health status every 10 seconds. This option costs more. 

Lambda

* A service to define serverless functions. Functions can be configured with env. variables and provided memory.  
* Functions can be uploaded via the Lambda code editor or a .zip file stored within S3.   
* Processes or services invoking this function can pass in events for the function to handle.   
* Logs are created by the service and sent to CloudWatch for monitoring and altering.  
* Developers pay only for the amount of requests, the invocation duration, and the compute power provisioned.   
* Every invocation goes through the AWS Lambda API, which provides 3 invocation modes:  
1. Synchronous  
- Request-response model  
- Best suited for processing messages from a stream or queue   
- Provides message filtering  
- Best suited for when message order needs to be maintained  
2. Asynchronous  
- Event-based which uses a built-in queue  
- Handles retries automatically, and failed events can be sent to a built-in dead letter queue or lambda destination for handling and inspection.  
- Best suited for long running functions which do not need to wait for a response.    
3. Stream (poll-based)  
- Lambda runs a poller, and the developer needs to create an event-source mapping to link the event source to the lambda function.   
- Best suited for a stream or queue service or cases where message-filtering is provided.   
4. AWS managed \- if an AWS service invokes the function, this is the default option. AWS automatically selects the invocation method based on the service calling the function. 

Serverless Application Model (SAM)

* A service which provides automatic server management and efficient development.   
* SAM Templates  
  * A config file used to define resources and structure for an AWS serverless application.   
  * The “Transform” directive is a key component of a template, since it specifies that Cloudformation logic should be used to parse the template.   
  * The “Globals” section of a template lets you define resources which can be invoked multiple times throughout the template.  
  * Common commands include:  
- AWS::Serverless:Function \- defines a Lambda function and the necessary IAM role to execute it, and the required event source mappings to trigger it.   
- AWS::Serverless::API \- define an Amazon API Gateway resource  
- Connector \- configures permissions between two resources, generating the needed IAM policies.  
- StateMachine \- Lambda Step Functions workflow  
- Application \- embeds an app from AWS serverless app repository or S3 as a nested application  
- SimpleTable \- a DynamoDB with a single primary key  
* SAM CLI  
  * Used for local development, testing, and deployment.   
  * Provides commands and templates for syntax verification.  
  * Popular commands are:  
- sam init \-: creates a new SAM application based on the user input  
- sam build : prepares the app for deployment  
- sam deploy \--guided : guided deployment of template using Cloudformation resources.  
- sam local : debugging tool locally  
- sam local \--invoke : runs the SAM app locally using a local container   
- same pipeline init : configures a CICD pipeline for the application  
- sam logs : fetching and filtering logs generated by the Lambdas within the template  
* Benefits of using SAM  
  * Simplifies creation of serverless apps compared to using AWS Cloudformation, thanks to the shorthand syntax for defining Lambdas, API Gateways, and DynamoDBs.   
  * It is a service built upon AWS Cloudformation.  
  * Integrates with popular tools and IDEs, and provides local debugging.

## **Storage** 

S3

* A fully-managed, highly-available object storage, which can store objects between 0B and 5TB.  
* Consists on a key-value architecture with a flat key hierarchy, meaning that key names must be unique  
* It is a regional storage service, meaning that developers choose the region for the data to reside and the service replicates it across multiple AZs within that region.  
* **Buckets** are containers for the data and must have a globally unique name. By default, a soft limit of 100 on the number of buckets which can be created per AWS account is set, but can be increased on request.   
* **Folders** can be created within buckets, and **objects** are stored using a key which specifies the bucket, folder (optional) and the file name.   
* Storage Classes  
  * These determine the availability of the stored data.  
  * Note on Intelligent Archive storage class \- S3 will automatically move data from frequent access to infrequent after 30 days of no access, to archive instant access after 90 days, and deep archive after 180\. Once accessed, data moves back to frequent tier.  
  * Note of Glacier storage classes  
- Glacier storage classes are cheaper and best suited for cold storage. Glacier uses regional vaults which contain archives instead of buckets and folders.  
- Writing and retrieving data out of glacier storage classes must be done programmatically.  
  * Standard storage classes:  
- Standard \- useful for frequent access to data  
- Intelligent Archive (int) \- frequent and infrequent access, ideal for unpredictable access patterns  
- Standard Infrequent (s-ia) \- equivalent to infrequent tier from the int storage class.  
- One zone infrequent access (z-ia) \- same as s-ia, but only provides durability for 1 zone  
  * Glacier storage classes:  
- Glacier instant retrieval (g-ir) \- long-lived archive data accessed at most once a quarter, provides millisecond access.  
- Glacier flexible retrieval (g-fr) \- accessed once a year with retrieval time of minutes to hours, depending on the request type. Retrieval can be done using the following requests:  
  - expedited $$$ under 250mb, available within 5 minutes  
  - Standard $$ any size, available within 3-5 horus  
  - bulk $ PB of data, available within 5-12 hours  
- Glacier deep archive (g-da) \- accessed less than once a year with retrieval time of 12-48 hours.  
* Bucket Versioning  
  * Allows multiple versions of an object to exist, and is managed automatically when versioning is enabled.  
  * Once enabled, versioning can be suspended but not disabled. Enabling versioning will incur additional cost.  
  * When deleting objects in a versioning-enabled bucket, the object is soft-deleted using a delete-marker.   
- For permanent removal, the object version ID must be specified.  
- If the version pointed to by the delete marker is removed, then the previous non-marked version will be returned by any future S3 GET API requests.   
* Logging  
  * Object-level Logging   
- when an S3 API call is made, AWS Cloudtrail captures it and stores it within a log file in S3. When enabling object-level logging, you must select an existing AWS Cloudtrail trail.   
  * Server-access logging  
- Captures details of a request made to the entire S3 bucket, not just the object.  
- When enabling logging, the destination and source bucket must be within the same region.  
- Encryption of generated logs can be done using SSE-S3 rather than SSE-KMS.  
- Additional costs are incurred for storing the log files, not generating them.  
- The S3 logging service needs access to write log files to the destination bucket, hence a bucket policy that grants write access to the service is required.   
* Transfer Acceleration  
  * Uses edge locations provided by AWS Cloudfront, a DNS service. For this reason, transfer acceleration is only possible on S3 bucket names which are DNS compliant.   
  * This feature incurs an extra cost, and does not support the following S3 API operations: GET, PUT, DELETE, and cross-region copies of objects via PUT.  
* Security   
  * Identity-based policies   
- These are attached to the identity requiring access using IAM permission policies.  
- Can be associated with the user, the group that the user belongs to, or to a role that the user has permission to assume.   
- Unlike resource-based policies, identity-based ones allow you to centrally manage access control methods within one service and can reuse IAM policies across buckets.  
  * Resource-based policies  
- These are attached to the resource and come in the form of bucket policies and ACLs  
- ACLs cannot implicitly deny access or implement conditional elements like with IAM policies  
- These require the developer to manually define who will be allowed or denied access  
- Buckets do not have a bucket policy associated by default. Also, you must specify the principal associated with an action within the bucket policy.  
- Unlike resource-based policies, these allow you to control S3 access within the service itself and can grant cross-account access without having to create and assume IAM roles.  
  * Policy Evaluation   
- Principle of least privilege \- allow objects have a deny by default, unless a policy allows it.  
- Cross origin resource sharing (CORS) allows web page resources to be requested from a different domain than that of the web page. CORS can be enabled within the bucket itself.  
- In order to enable CORS, S3 will process the first matching rules for the following:  
  - The requestors Origin header matches an entry made in the AllowedOrigins element of the policy  
  - The method used in the request matches the AllowedMethods element  
  - The header used in the request's Access-Control-Request-Headers header matches the AllowedHeader element  
* Encryption mechanisms  
  * Server-side encryption with S3 managed keys **(SSE-S3)** is AWS managed and is the cheapest SSE option since no external calls to other key management services are required.  
  * Server-side encryption with KMS managed keys **(SSE-KMS** or **SSE-C)** allows encryption with either a customer-managed or AWS managed key supplied via KMS.   
- Usage of the keys can be tracked via AWS Cloudtrail, since it logs all API calls to KMS.  
- It is important that the S3 bucket has the correct permissions to encrypt and decrypt objects.  
  * Client-side encryption uses the S3 Encryption Client which will generate a symmetric plaintext data key and encrypt it with a wrapping key (envelope encryption).   
- **CSE-KMS** is where KMS provides the wrapping key, whereas **CSE-C** is where the client provides it  
* Lifecycle configurations  
  * Lifecycle rules allow you to specify how objects will be deleted or moved between storage classes based on the access patterns. If these are predictable, lifecycle configurations are the most cost effective solution.   
  * Configurations are defined as sets of rules, with each rule consisting of:  
- ID \- name of the rule  
- Filter \- which objects are affected  
- Status \- enabled or disable the rule  
- Action  \- which storage class the objects are moved to  
  * Note that when data is moved to a lower cost storage class it cannot be moved back up manually

EFS

* It is a storage service optimised for low latency access and high level throughput.   
* It supports concurrent access by multiple EC2 instances via mount points, one for each AZ.  
* It allows storage of files which are accessible to network resources  
* Files are replicated across many AZs within a single region.  
* Storage classes  
  * Either “standard” or “infrequent access”, which provides lower cost but higher latency.  
  * Both have the same level of availability and durability  
  * EFS lifecycle manager moves data between the two storage classes based on access patterns  
* Performance options  
  * Performance modes include either General purpose or Max IO, for files which require 7K+ IOPS  
  * Throughput modes include “bursting” which scales throughput alongside the file system, and “provisioned” where throughput is purchased in advance. 

Performance Factors

* Block storage such as EBS is best suited for hard drives and SANs which require high throughput and low latency and when data can be stored in blocks of less than 256MB in size.  
* Object storage is best suited for large, unstructured data  
* File storage is best suited for network attached storage which requires high throughput.

## **Databases** 

DynamoDB 

* A fully-managed serverless NoSQL database, meaning that AWS manages the service and the underlying database server, while the user is responsible for managing and modelling data.  
* It is mainly a key-value database but also supports document access patterns.  
*  Key features include:  
  * High availability via automatic replication across 3 AZs within the chosen region.  
  * Provides eventual read consistency by default when replicating data, but an option for strong consistency may be specified by the developer.  
  * Supports transactions and is ACID compliant  
  * **Global tables** allow you to replicate data within replica tables within multiple regions chosen by the developer. You can write to any table and read from the geographically closest table.  
  * **Backups** can be on-demand (user-triggered) or point-in-time recovery up to 35 days in the past. DynamoDB also integrates with AWS Backup.   
* DynamoDB is best suited for OLTP workloads with high scalability and data durability requirements, or if developing a new serverless application. It is not suited for OLAP workloads or ad-hoc query access.   
* Terminology:  
- **Partition keys** uniquely identify records and are used for logical data partitioning.  
- Optional **sort key** to sort data within their partition, for faster information retrieval.  
- **Composite primary keys** are made of a Partition and a Sort key.  
- When creating a table, you need to configure the read and write throughput via: 

  1\. provisioned (choose read and write capacity units, RCUs and WCUs) mode

  - For an item of 4KB, you’ll need 1 RCU for strong read consistency, 0.5 for eventual read consistency, and 2 RCU for transactions.   
  - 1 WCU \= 1 write/s for items up to 1KB in size. Transactions require 2 WCUs  
    2\. On-demand \+ DynamoDB Auto Scaling, specifying an upper limit of RCUs & WCUs.  
* Performance considerations:  
- Binary data or relational data is best suited for Amazon RDS, not Dynamo DB.   
- Check the average item size in the Dynamo console before allocating RCUs and WCUs.   
- The “query” operation uses a partition key and sort key to find the items to be returned, whereas the “scan” query reads the entire table for items that match a given *filter* expression, and hence it should be avoided for performance’s sake.  
* Indexing  
- Global secondary index (GSI) \- an index with different partition and sort keys from the base table ones. Requires its own throughput and allows for eventual consistency only. These can be defined anytime.   
- Local secondary index (LSI) \- an index with the same partition key but different sort key. Uses the core table throughput and allows for strong consistency. These can only be defined during the table creation step.  
* Partitioning  
- DynamoDB will add a new partition to your database automatically when either the partition grows larger than 10GB or the partition exceeds 3000 RCUs or 1000 WCUs.   
- The partition key should provide a balanced cardinality, i.e. number of unique values.This is important for performance since a low partition key cardinality will lead to less partitions in total and a higher likelihood that one of the partitions breaches the throughput limits, causing request throttling and even partition failure.   
  - DynamoDB *Adaptive Capacity* automatically redirects unused throughput towards hot partitions.  
  - DynamoDB **Accelerator (DAX)** can be used to cache reads in read-heavy workloads, saving partition throughput. 

RDS

* A managed, relational database service.   
* You can select the database engine and database instance type (general purpose vs storage optimised) based on common parameters such as size, vCPU, etc.   
* A secondary replica can be configured as a fail-over option within another AZ, using the Multi-AZ option. Replication of RDS occurs synchronously. The following scenarios will cause failover to be triggered automatically:  
1. Patch maintenance  
2. Host failure  
3. AZ failure  
4. Instance rebooted with failover  
5. DB instance class is modified.  
* **Storage Auto-scaling** is supported using AWS EBS.  
* RDS supports both horizontal and vertical scaling, done either immediately or on a schedule.   
* Backups are enabled by default on new RDS instances. These backups are stored on AWS S3 and can be encrypted using KMS.   
* **RDS Proxy** is a managed service which can be used to manage RDS connections which are short lived, such as when triggered by a Lambda function. This proxy layer helps to improve performance, security, and application availability.  
  * It can force the use of IAM credentials and integrates well with AWS Secrets Manager.

Elasticache 

* A web service for deploying and operating an in-memory cache, either Memcached or Redis.   
* Integrates with many compute services, as well as Cloudwatch for monitoring of performance.   
* Memcached  
  * Is multithreaded and designed as a non-persistent caching solution.  
  * Cache nodes are organised in clusters which can span multiple availability zones.   
  * Cluster scaling is implemented by the developer using the ElastiCache API  
  * Supports auto-discovery of new nodes and automatic node replacement in case of failure  
  * Not suitable for applications which require robust encryption standards.   
* Redis  
  * Supports complex data types such as sorted sets and lists   
  * It includes a persistency and replication mechanism which allows for multi-AZ deployment   
  * Elasticache for Redis supports role-based access control.  
  * Supports sorting and ranking of cached datasets  
  * Supports the pub/sub messaging model  
* Elasticache for Memcached  
  * Cloudwatch monitors memory usage, CPU utilisation, and cache hit ratio  
  * It uses AWS EC2 as the underlying computer host, hence VPCs, AZs, Security Groups, NACLs are involved.  
  * Best practice for security and high availability:  
1. Deploy cache clusters within subnets at all times  
2. Use at least 2 AZs to spread the cache cluster  
3. Provision NACLs and Security Groups to define access to clusters from the application layer.  
4. Create an Elasticache subnet group to include the private subnets to be used for deployment.   
   * Ensure that the client library used to connect to the cluster supports *consistent hashing* for performance.   
   * Cache eviction is done automatically by the service for rarely used cache keys.  
* Caching types  
  * Lazy (cache aside) \- data is read from the DB and  written in the cache only when a cache miss occurs. Suitable for data that is read frequently but changed rarely.  
  * Write through \- when data is written to the DB, it is also written to the cache. It is better for avoiding cache misses.   
* Cache key expirations   
  * Keys can be deleted either manually or by setting a time-to-live (TTL) which will automatically expire them.  
  * TTL is not suitable for write-through caching, since this technique keeps the cache up to date at all times.  
  * When setting up a TTL use some randomness to avoid the scenario where multiple keys expire simultaneously.  
* Elasticache for Redis  
  * Redis clusters/**shards**  consist of one node with possible (up to 5\) read replica nodes within the cluster.Only the master node supports read/write operations.  
  * Replication is asynchronous, and it supports multi-AZ replication.  
  * Developers should establish a connection to the main node in the cluster for write operations and a second connection to one of the replicas for read operations. This setup requires no changes in case of fail-over.  
  * In production, multi-AZ with autofailover is the best practice.  
* Measuring Cache success  
  * Elasticache integrates well with CloudWatch for monitoring purposes.  
  * A high CPU utilisation indicates a saturated cache node.   
  * Redis is single threaded by nature, hence a redis node that is saturated due to too many read requests can be alleviated by adding replicas within the shard, while for too many write requests, adding a new shard is the best solution.  
  * Other important metrics:  
- Evictions \- when the cache is almost full, the LRU key is evicted. A high eviction rate indicates that the cache may be almost full and needs to be scaled.    
- Misses \- high miss and eviction rate indicates that the cache is running out of memory

MemoryDB for Redis

* A managed, redis-compatible in-memory datastore.   
* Clusters may have up to 500 nodes, supporting data storage up to 100TB.  
* Data tiring allows you to move less-frequently accessed data to disk  
* Encryption is supported both at rest and in transit  
* Snapshots are supported as well. 

## **Networking & Content Delivery**

Subnets

* Virtual Private Clouds (**VPC**) is an isolated segment of the AWS public cloud. You are allowed up to 5 VPCs per AWS region, per account. When defining a VPC it needs a name and a CIDR block, which is a range of IP addresses that the VPC can use.   
* **Subnets** reside inside a VPC and allow you to segment your VPC, again they require a name and CIDR block and they can be either public or private.  
  * Public subnets are accessible from outside the VPC. To make a VPC public, an AWS managed Internet Gateway is attached to the VPC, and an entry within the Subnet’s route table that points to the IGW is also required.  
  * Within a subnet, the IP addresses 10.0.1.0, 1, .., 3, 255 cannot be used by apps since they are reserved.  
* Network Access Control Lists (**NACL**) are network-level firewalls attached to a subnet. NACLs are stateless, meaning that any response traffic generated must match a rule in the NACLs to be able to leave the subnet.   
* **Security Groups** are instance-level firewalls attached to a subnet. With security groups, all traffic is blocked by default unless there is a specific “allow” rule specified. Security groups are stateful by design.  
* **NAT Gateway** sits within a public subnet and is attached to a public elastic IP address.   
  * This AWS-managed component allows private instances to be able to access the internet while blocking connections initiated from the internet. 

Cloudfront 

* A caching service which allows to distribute content globally with minimal latency through edge locations. Static content is stored within S3, while dynamic content is generated by a compute resource such as EC2 or Lambda.  
* Cloudfront is composed of 3 caching layers, which provide better cache hit ratios and network performance:  
1. Cloudfront distributions existing within Edge Locations  
2. Regional Edge caches   
3. AWS origin shield \- not enabled by default  
* Security features include:  
  * Encrypted SSDs for data at rest  
  * Signed URLs and cookies to whitelist access  
  * Integrated with AWS Web Application Firewall (WAF) to create web ACLs  
  * Geo-restrictions to implement location-oriented security  
  * Integration with AWS IAM  
  * Monitoring services such as CloudWatch Alarms, CloudTrail Logs, CloudFront Logs.


Route 53

* A DNS management service which translates from domain names to IP addresses.   
* **Hosted Zones** contain Name Server records (used to identity the DNS server for a hosted zone) and Start of Authority records (used for validation of truth)  
* Supported Record types:  
  * IPv4 and IPv6 \- used to map a hostname to an IP address  
  * Mail exchange \- used to identify email servers for a given domain  
  * Text \- used to provide text-format information to systems outside your domain  
  * Canonical \- used to map a hostname to another hostname  
  * Alias \- maps a custom hostname in your domain to an AWS resource  
* Health Checks  
  * Used to answer DNS queries by querying the endpoint every 30 seconds, unless specified to 10 seconds.   
  * It can also be used to check a CloudWatch alarm.  
  * Health checks can be associated with AWS SNS to notify stakeholders when the checks fail.  
  * If a health check is not associated with a record, it is assumed to be healthy.  
* Routing Policies  
  * Simple \- provides the IP address associated with a name. Multiple records can be associated with a name, so one of them is chosen and returned at random. This policy does not support health checks.  
  * Weighted \- similar to Simple, although developers can assign a weight to each record. If an unhealthy record is returned, then the next heaviest record is chosen until a healthy one is found.   
  * Geolocation \- records are tagged as Default, Continent, or Country. This policy allows the distribution of the IP of a resource based on the country or language of the requestor.   
  * Geopromiximity \- requires Route 53’s Traffic Flow feature to create a traffic policy. Records are tagged with latitude and longitude or an AWS region.  
  * Failover \- requires health checks of records to be enabled. A secondary record can be configured to be returned if the primary one fails a health check.   
  * Latency \- returns the record with the lowest expected latency based on the requestor’s location.  
  * Multivalue Answer \- returns up to 8 healthy IP addresses to a query.   
* Traffic Flows  
  * Allows you to create a traffic flow configuration containing multiple routing policies and health checks.  
  * Traffic policies are automatically versioned, and older versions continue to be available until deletion.   
* Resolver  
  * Serves as the DNS service for VPCs that integrates with your on-premise data centre.  
  * Connectivity between the data centre and AWS needs to be established via a VPN or Direct Connect connection.  
  * Endpoints for DNS queries must be configured for traffic in and out of the VPC, and they are assigned to IP addresses within each subnet in the VPC needing the Route 53 resolver.  
  * The Route 53 Resolver DNS Firewall is a managed firewall service for queries that start from within the VPC. A rule group needs to be defined for the firewall, with each rule consisting of a domain list to inspect and an associated action when a query results in a match.   
- Queries can be allowed through, allowed through with an alarm, or blocked with a response.  
- The rule group needs to be associated with the VPCs that you want to protect and Firewall will apply the defined filtering rules to the outgoing VPC traffic.   
* Recovery Controller  
  * A set of configurations that monitor your Route 53-enabled application failure recovery capabilities across Regions, AZs, and your own datacentres.   
  * These ensure that the recovery environment is scaled and configured in case of failure.  
  * Readiness checks work with Routing Controls to give you the ability to failover an application. Safety rules should be implemented to prevent failover to unprepared replicas of your application.


API Gateway 

* A service which provides a service layer between frontend clients and the DB of an application.  
* It uses AWS lambda to define the logic behind the API endpoints defined.   
  * To connect API Gateway to Lambda and allow it to invoke the function, the API must be included as a principal under the resource-based policy statements within the lambda function.


Elastic Load Balancer (ELB)

* ELB manages the flow of inbound traffic to a group of targets, which may reside across one or multiple AZs.  
* ELB is managed by AWS and is elastic, meaning that AWS will automatically scale the load balancer according to traffic, making it highly resilient.  
* Components on an ELB:  
  * Listeners \- at least one per load balancer. These define how inbound traffic is routed based on conditions.  
  * Target Groups \- a group of instances the load balancer routes requests to. A single ELB can be configured with multiple target groups, each associated with a different listener configuration and rules.  
  * An ELB contains 1+ listeners, which contain 1+ rules, which contain 1+ conditions which map to one action.  
  * Health checks \- performed against resources within the target group and are performed by the ELB.   
  * Internet-facing ELB \- ELB nodes have a public DNS name which allows the ELB to serve internet requests  
  * Internal ELB \- it only has an internal IP address, meaning it can only serve origins coming from a VPC.  
  * ELB Nodes \- a node is placed within each AZ, this is the developer responsibility.   
  * Cross-Zone Load Balancing \- ELBs will distribute all requests evenly across targets, even if residing in multiple AZs.   
* SSL/TLS Server Certificates   
  * In order to receive traffic over HTTPS, the ALB will need a server certificate and a security policy.  
  * The certificate is an X.509 certificate issued by a Certificate Authority such as AWS Certificate Manager.  
  * The certificate is used to terminate the encrypted connection received from the remote client, which allows the request to be decrypted and forwarded to the resources in the ELB target group.  
  * Within AWS, certificates can be either issued by AWS Certificate Manager for supported regions or IAM.    
* Types of ELBs  
  * Application Load Balancers \- works at the application level analyzing the HTTP header to direct traffic  
  * Network Load Balancers  
- balance requests purely based upon the TPC protocol, and hence are highly efficient.  
- If an application requires a static IP address, then the NLB is the best choice of ELB  
- Unlike other types of ELBs, NLBs allow to enable or disable cross-zone load balancing.  
  * Gateway Load Balancer  
- Supports the deployment and scaling of virtual appliances.  
- VPC ingress routing allows users to forward requests to an Internet Gateway within a VPC and then to an Elastic Network Interface and then to a GLB by updating the route tables in the VPC.  
- GLBs can redirect all inbound and outbound traffic within a VPC to a target group of Virtual Network Appliances for security processing and not interrupt the normal request/response cycle.  
* ELB and Auto-Scaling   
  * In this setup, the ELB can handle traffic based on target groups and rules, while EC2 auto-scaling elastically scales the target groups based on the volume of traffic.  
  * For ALBs and NLBs, you will need to associate the auto-scaling group with the target group, while for the Classic Load Balancer, the EC2 fleet is directly registered with the load balancer. 


## **Analytics** 

Kinesis

* A service which helps with ingestion and processing of real-time streaming data.   
* Access is controlled using IAM. Data at rest in the stream and in the loading destination is encrypted using KMS, while data in transit is protected using the TLS protocol.   
* It is composed of 4 sub-services  
  * Kinesis Video Stream  
  * Kinesis Data Stream  
  * Kinesis Data Firehose  
  * Kinesis Data Analytics  
* Layers of Stream Processing include:  
  * Source \- where data is produced  
  * Stream Ingestion  \- data is put as records into the stream by Producers, which are limited to writing 1MB/s or 1000 writes per shard per second  
  * Stream Storage \- services such as Kinesis Data Stream are an example. Data is stored here for 24 hours up to 1 year, and records cannot be deleted, they only expire  
  * Stream Processing \- Consumer applications process data records   
  * Destination \- where consumers send the data post-processing 

Kinesis Data Stream

* Does not support auto-scaling natively, it is up to the developer to include it as a solution.   
* Data streams are composed of **shards**, and shards contain a series of **records**. Data records contain a sequence number, a partition key, and a data blob.   
* Retrieving data from a stream is free within the retention period and charged after, unless subscribing to a shard using an Enhanced Fanout client  
* Consumers can be classified as:  
  * Classic \- consumers pull data from a shard. More consumers means that the shard’s throughput is divided between them.   
  * Enhanced Fan Out \- consumers can subscribe to a shard and data records are pushed to the consumers automatically using HTTP/2 protocol. Shard throughput limits are removed and each consumer gets 2MB/s of provisioned throughput per shard.   
* Shards  
  * Every shard has a unique hash key range that does not overlap. Hash ranges determine where a data record is inserted in the stream based on its partition key.  
  * Each shard has a throughput of 1000 data records per second. When placing data in a stream it is recommended to randomise the partition key in order to distribute load across available shards.  
  * Resharding is the process by which KDS scales.   
  * Shards become hot when the majority of records are written to it and can throttle the entire stream. Resharding can help:  
- Hot shards are closed for data records to expire but still be consumed.  
- The hot shard now gives birth to two new child shards.  
- Warning \- in an active stream, only one split or merge can happen at a time\!  
  * Similarly, cold shards can be mitigated by merging shards, avoiding wasted resources.   
  * The total throughput of a stream is the sum of the throughput of all shards in the stream.  
  * To determine the number of shards needed  
- Take the majority of the data to be ingested and the data to be consumed  
-  Look at the average KB size of each record and the average number of records/second  
- Look at the number of consumers and producers involved in the application  
- Compute the incoming write bandwidth B \= number of records/s \* average record size.  
- Compute the outgoing read bandwidth R \= number of consumers \* B   
- Number of shards needed \= max(B/1000, R/2000)  
* Security   
  * IAM policies and roles can be used to control access to administrators, stream resharding, producers, and consumers  
  * Data can be encrypted in-flight using HTTPS endpoints and at rest using KMS (encrypted before entering the stream, and decrypted after exiting the stream)

Kinesis Data Firehose

* It is a fully-managed service for ingestion, transformation, and movement of data and unlike Kinesis Data Stream it is not a storage layer.   
* It uses Producers to load data into the stream, from where it’s delivered to the destination.   
* This service buffers data based on a buffer time of 60-900 seconds and buffer size. Data leaves the stream when the buffer is full or the interval expires.  
* This service supports auto-scaling, can convert data from JSON to columnar format, and can also invoke Lambda functions for data transformation.  
* The Kinesis Agent is a pre-fabricated Java application that collects and sends data to your delivery stream. 

Kinesis Data Analytics  

* This service can read from data in motion and carry out aggregation and analysis. It is suitable for ETL, and real-time analytics.    
* Data records can only be queried using SQL. 

OpenSearch 

* A fully-managed service for deploying OpenSearch clusters, which provide an analytics and visualisation suite based on Elasticsearch and Kibana.   
* Cluster deployments across 2 or 3 AZs offer high availability.  
* Capable of ingesting streaming data from Cloudwatch Logs, Kinesis Data Firehose, S3, DynamoDB, etc. 

Athena 

* A service to query and analyze up to petabytes of data in S3 and other data sources using SQL.  
* Uses data definition language (DDL) to define tables and supports querying of CSV, JSON, Parquet.  
* Allows the use of partition keys and integrates with EMR, AWS Glue, QuickSight, and Redshift Spectrum.

## **Management and Governance** 

CloudWatch

* A managed global service which provides insights into health and operational performance of applications and infrastructure.   
* Composed of multiple components such as:  
  * Cloudwatch Dashboards \- allows you to display data from all regions into a customisable view  
  * Cloudwatch Metrics and Anomaly Detection \- by default everyone gets access to common metrics every 5 minutes, but with detailed monitoring enabled for a small fee, this can be every 1 minute.   
- Intended for the automation of the creation and maintenance of Cloudwatch alarms, and at least 3 days of data is recommended for training the model.Anomaly detection is done using machine learning within cloudwatch, done by the service itself.    
  * Cloudwatch Alarms \- tightly integrates with Metrics, and can trigger actions when metrics reach a certain value or fall outside of a range.Alarms can be in 3 states:  
- OK \- the metric is within the configured threshold   
- ALARM \- the metric is not within the threshold  
- INSUFFICIENT\_DATA \- the alarm is too new and there is not enough data yet.   
  * Cloudwatch EventBridge \- allows real-time monitoring and response to events.   
  * Cloudwatch Logs \- gathers all logs from AWS services into one location. The **Unified Cloudwatch Agent** can collect logs and metrics from EC2 instances and on-premise windows/linux servers.    
  * Cloudwatch Insights \- monitor streams of logs coming into Cloudwatch and configure filters. There are three types of insights:  
- Log \- filter and visualise logs that are captured by Cloudwatch logs  
- Container \- capture metrics and diagnostic data from a cluster of containers  
- Lambda \- this has to be enabled for each function  
* Cloudwatch subscriptions  
  * Logs can be shared across accounts if using Kinesis Data Stream as a destination for the logs. The recipient needs to set up a Cloudwatch Logs destination, which must be in the same region as the log group.   
1. Create the receiving resource for the Cloudwatch logs, such as a Kinesis Data Stream  
2. Setup a **subscription filter** to define a pattern to be searched in the logs, and any matching entry will be ingested by the receiving resource. Each filter contains:  
- Log Group Name, which the filter is associated with. Any log entry created within this group will be filtered and sent to the receiving resource if a match is found.   
- Filter Pattern  
- Destination ARN  
- Role ARN which grants CloudWatch logs the permissions required to send the filtered data into the destination resource.   
- Distribution method \- only required when the destination is Kinesis, otherwise data is grouped by log stream or randomly distributed across the destination resources.   
* VPC FLow Logs  
  * Allow you to capture IP traffic information that flows within your VPC, which is good for auditing and spotting traffic going to the wrong destination. This data is sent directly to Cloudwatch Logs, using a different log stream for every network interface in the VPC.   
  * Flow logs cannot be edited, and hence must be deleted and recreated  
  * To push flow log data to a Cloudwatch Log Group, an IAM role is required with the relevant permissions, and that the VPC Flow Log can assume this role.    
  * Flow logs can be created against:  
- A network interface on one of your instances  
- A subnet within a VPC or the entire VPC itself

CloudTrail

* A service which tracks all API and non-API requests within an AWS account.   
* CloudTrail consolidates activity records from multiple regions into a single S3 bucket.     
* Events are categorised into:  
  * Management events \- management operations on AWS resources  
  * Data events \- resource operations such as S3 object-level activities  
  * Cloudtrail Insight Events \- capture unusual activity, helping with identifying potential issues.   
*  Users can create CloudTrail Trails to store, review, and analyze events beyond the Event History, with data stored in Amazon S3 or sent to Amazon CloudWatch Logs. There are three types of trails \- All region, Single region, AWS Organisation.    
* Cloudtrail Lakes  
  * Allows storing and querying events for up to 7 years, using SQL to extract specific data for analysis.  
  * Can also capture log events from AWS Config and external sources.   
* Permissions   
  * If CloudTrail creates resources like S3 buckets or SNS topics, permissions are automatically applied; otherwise, they must be manually set.  
  * The process involves enabling CloudTrail, updating bucket policies, and creating trails in other accounts to deliver logs to the designated S3 bucket.   
* Leveraging AWS Cloudwatch to monitor AWS Cloudtrail files  
  * Enabling CloudTrail logs to be delivered to CloudWatch is optional and requires configuration during trail creation or by editing an existing trail.  
  * Users can select or create a log group in CloudWatch and assign a role for CloudTrail to publish logs.  
  * CloudWatch provides security monitoring by notifying users of changes to security groups, network access control lists, and IAM policies.  
  * CloudTrail tracks both successful and unsuccessful API calls, helping identify potential security threats or misconfigured permissions.

CloudFormation

* A service for deploying resources using Infrastructure as Code. A template is defined and then uploaded to the service, which will take care of instantiating a Stack (a collection of AWS resources managed as single units). Stacks are either fully created or destroyed if this cannot be achieved.   
* CloudFormation can use Amazon SNS for notifications and stack policies to control resource updates.

AWS Systems Manager

* State Manager  
  * Manages configurations such as firewall settings and service management to ensure compliance across managed instances.  
  * Uses automation documents to define policies, with predefined options for common use cases, and maintains configuration consistency by reapplying desired states and tracking configuration history.  
  * An association in State Manager consists of a document defining the desired state, target instances, and a schedule for applying configurations. It can identify and repair noncompliant machines.  
  * Supports event-driven architectures through Amazon EventBridge and logs interactions to CloudTrail. Outputs can be sent to CloudWatch Logs or Amazon S3, with access managed via identity and access management.  
* Patch Manager  
  * Patch Manager is a feature of Systems Manager that automates patching for managed instances.  
  * Patch groups can be used to organize patch deployment strategies across different environments and application tiers. A specific tag key, "Patch Group," is required for defining patch groups.  
  * Managed instances can be scanned for missing patches, which can then be automatically installed, and patch compliance reports can be generated.  
  * Maintenance windows can be used to apply patches during specific times.   
* Documents   
  * Documents are used with the run command to execute actions on instances and stored in the Systems Manager Documents Store and are shared resources.  
* Parameter Store  
  * AWS Systems Manager Parameter Store allows centralized storage of parameters, which can be retrieved via API calls. It supports encryption but not by default, and it doesn't offer automated rotation for credentials.  
  * Parameters can be tagged, organized into hierarchies, and tracked for changes using versions.  
  * Notifications for parameter changes can be created, and custom validation routines can be implemented using AWS Lambda.  
  * Pricing for Parameter Store varies by tier (Standard or Advanced) and API interactions.

AWS Secrets Manager

* AWS Secrets Manager is designed for storing sensitive data with encryption enabled by default. It supports automated rotation for certain databases using Lambda functions.  
* Secrets Manager allows sharing secrets across AWS accounts, unlike Parameter Store, which requires separate stores for each account.  
* Access to secrets is controlled through fine-grained IAM identity-based and resource-based policies, with access denied by default until explicitly granted.   
* Secrets are encrypted using AWS Key Management Service (KMS).  
* Secrets Manager charges for storage and API calls without a free tier.

AWS AppConfig

* A service to control when and how to deploy features and app updates, ensuring apps are always running in a desired state and changes are deployed in a graceful manner  
* Integrates with Cloudwatch Alarms for automatic rollback if issues are encountered during deployment  

AWS Cloud Development Kit (CDK)

* Open-source framework that allows you to define AWS resources and infrastructure as code, which generates an equivalent Cloudformation template at compile time.   
* Provides **constructs** which are sets of libraries to define AWS resources, and can be customized and shared amongst developers.

## **Developer Tools** 

Deployment Methods 

* Common deployment methods include:  
  * Blue-Green \- Blue-green deployment involves two environments, blue and green, where traffic can be switched between them to minimize downtime. This allows for easy rollback if issues arise.  
  * Canary \- Canary deployments involve releasing a new version to a small group of users to monitor its performance before a full rollout. This method helps detect issues early.    
* Server (virtualised instance) types  
  * Mutable  
- Servers whose configuration and settings will change over time.   
- Ideal when configuration management is available or for small teams and test environments.   
- Cons of mutable servers involve potential issues with failed deployments, lack of a consistent starting configuration, and the need for separate testing of OS changes.  
  * Immutable  
- Server whose settings don't change, the server is only ever replaced. These are preferred due to their consistency and reliability.   
- Pros of immutable servers include higher trust in deployments, quick scaling, and integrated testing of OS changes.  
- Cons of immutable servers involve longer build times, the need to manage server images, and additional tools for baking and deployment.

AWS Cloudshell

* A browser-based linux shell experience that allows pre-authenticated access to the AWS CLI. Security is pre-configured based on the credentials of the user logged into the AWS console.   
* Home directory includes 1GB of persistent storage. 

AWS CodeBuild

* A fully managed service which allows you to compile source code, run unit tests, and then create an artifact that can be deployed.  
* Core concepts   
  * The project, source code for the project can be stored in S3 as well. Once the build is complete, the artifact can be uploaded to S3, and from there S3 triggers can be used for further steps.   
  * The build environment, essentially a docker container that contains software to manage the build.  
  * The buildspec file, which is where the build commands can be specified, on top of the command line.

AWS CodeDeploy

* This service can be used with CodeCommit, CodeBuild, and CodeDeploy together such that new commits into the repository trigger CodeBuild and kick off the build artifact process.  
* CodeDeploy automates application updates, ensuring new features are available quickly without system downtime.   
* Users first create an application and select a deployment platform: EC2/On-premises, Lambda, or ECS.  
* A deployment group is then created, specifying servers or clusters for code deployment.  
* Deployment configurations control the speed and method of deployment, with options varying by platform.  
* Deployment types include Canary, Linear, and AllAtOnce, each offering different levels of safety and traffic management.  
* EC2/on-premises deployments require a CodeDeploy agent installed on servers for communication.  
* The deployment process involves creating a deployment with a specified revision, which includes a code package and an appspec file.  
* CodeDeploy integrates with CloudWatch and SNS for monitoring and notifications of deployment events

AWS CodePipeline

* AWS CodePipeline is a fully managed continuous delivery service that automates the building, testing, and deployment of code.  
* A pipeline consists of multiple stages, each with actions that can run in parallel or sequentially. The six action types are approval, source, build, test, deploy, and invoke.  
* Pipelines can be automatically triggered by new commits in CodeCommit or set to poll for changes in the source repository.

AWS CodeStar

* Helps build CI/CD pipelines using pre-defined components and AWS developer tool services.  
* It additionally provides Dashboard Visualisation,  Team membership management, and issues and ticket tracking integration.   
* Team Management roles include Owner, Contributor, and Viewer. 

AWS X-Ray

* Provides tracing of requests through different services in your distributed applications  
* The service map shows each service and how they are linked as understood by X-Ray, each service is surrounded by a circle showing the rate of requests  
  * Red \- server faults  
  * Yellow \- client faults  
  * Purple \- throttling   
  * Green \- successful  
* The **X-Ray Deamon** is a software application installed in your application that gathers raw data from requests and forwards it to the AWS X-Ray API, the frequency of this is governed by Sampling Rules.    
  * Data is stored within X-ray for 30 days.   
  * Note that the demon must have the correct permissions to authorise and publish the tracking data.  
  * When the demon is deployed in EC2, these permissions can be given via IAM role, otherwise they must be provided via AWS Secrets Manager.  
* Instrumentation Concepts  
  * Segments \- portions of the service that correspond to a single service  
  * Subsegments \- remote call or local compute section within a service  
  * Traces \- end to end path of a request through the application   
  *  Filters \- used to trace certain requests based on performance issues for a specific metric  
  * Annotations \- business data added to the trace, indexed for filtering  
  * Metadata \- business data added to the trace, not indexed for filtering  
  * Exceptions \- applications error message and stacktrace

## **Containers** 

ECS 

* A service which allows you to run Docker-enabled applications packaged as containers on EC2 instances.  
* AWS Fargate is used to handle cluster management, it’s an engine used by ECS to run containers.  
* ECS clusters can be monitored through AWS Cloudwatch, and Cloudwatch alarms can be configured for certain metrics on the ECS containers.   
* When launching an ECS cluster, you can choose between 2 deployment modes:  
  * Fargate launch \- less configuration overhead  
  * EC2 launch \- more configuration overhead but more customisability  
* Since an ECS cluster is an ensemble of EC2 instances, EC2 features such auto-scaling, security groups, and load balancing can be configured.  
* Cluster properties  
- They act as a resource pool which aggregate resources such as CPU and memory.  
- They are dynamically scalable but not cross-region, and container deployment can be time-scheduled as well.    

ECR

* This fully-managed service provides a secure registry location to store and manage your docker images  
* Some common components include  
  * Registry  
- Allows for host and storage of docker images and creation of image repositories   
- Your account will have default read and write access to images within the registry, additional permissions can be controlled using IAM policies and registry policies.   
  * Auth. Token  
- Can be used by the Docker client to authenticate itself as a user in AWS.  
- This is done by running the “ecr get-login-password” command in the AWS CLI, and lasts 12 hours before re-authentication is needed.   
  * Repository \- objects within a registry that allow grouping of different docker images. These can be secured using IAM or repository policies.   
  * Repository Policy  
- These are resource-based policies, hence a principal must be associated with the policies.   
- For an AWS user to access a registry they need to call the ecr:GetAuthorizationToken API.  
- Once they have this access, the registry policy will determine what users can and can’t do   
  * Image 

EKS

* The elastic container service for Kubernetes allows you to use K8s within your AWS infrastructure, without having to provision the running infrastructure. All is needed is for you to provision and maintain worker nodes  
* The Kubernetes Control Plane   
  * The K8s control plane consists of APIs, kubectl processes, and the K8s Master used to schedule containers onto nodes. It continually monitors the objects.   
  * AWS EKS manages the control plane using multiple AZs for additional resilience.   
* Worker Nodes  
  * A node is a worker machine in K8s. It runs as an on-demand EC2 instance provisioned with the required software to run containers. This is achieved using AMIs to create nodes.    
  * Once the worker nodes are provisioned they can connect to EKS via an endpoint.  
* Working with EKS  
  * A (IAM) service role needs to be created to allow EKS to provision and configure resources.   
  * An EKS Cluster VPC needs to be created by running a CloudFormation stack.  
  * Install the K8s CLI kubectl, and the AWS-IAM-Authenticator in order to authenticate with the cluster  
  * Create an EKS cluster using the service role and VPC created, and configure kubectl for the EKS cluster using a kubeconfig command.   
  * Provision and configure Worker Nodes once the Cluster is in active status, and then configure them to join the cluster.  

AWS Copilot

* A CLI tool that simplifies the development, deployment, and management of containerised apps on AWS.  
* Creates, configures, and deploys containerised applications to ECS on Fargate.   
* Invoke the “copilot init” command, answer a few questions, and the service will take care of the entire process and output the URL to the production-ready service. 

## **Security, Identity, and Compliance** 

IAM

* The IAM sign-in link can be shared with users who will need access to your IAM console.  
* **Users** are objects within an organisation which can be people or even applications.   
* User Groups   
  * Used to grant objects within them access to certain resources through policies.  
* Roles  
  * Allow users, AWS services, or applications to adopt temporary IAM permissions to access AWS resources. Roles don’t have login credentials, instead they are assumed by an entity.  
* Policies  
  * JSON documents which define access to resources and can be attached to users or roles.  
  * Different types include:   
1. Identity-based \- attachable to any IAM entity, and can be  
- In-line policies, which are explicitly written and embedded directly within a user group, user object, or role. These are high maintenance and should be avoided.  
- Managed policies, which can be applied to user groups and roles  
2. Permission Boundaries \- they do not explicitly grant permissions, but define the maximum level of permissions which can be granted to a user or a role.   
3. Resource-based \- attached in-line to resources themselves. This policy defines the principal which can assume the role specified by the policy.    
4. Organisation Service Control Policies (SCPs) \- they do not grant permissions explicitly but define the max boundary of access to users within the associated account or OU.   
   * Evaluation logic  
- By default, access to a resource is denied unless allowed explicitly within a policy for the authenticated principal. Any other “deny” policy for the same resource and principal will win.   
- Policies are evaluated in this order: Organisational SCPs → Resource-based → IAM Permission Boundaries → Identity-based.     
* Identity Federation/Providers  
  * Allow for federated access, which allows an IAM object to use credentials external to AWS to authenticate and gain access to AWS resources.  
  * Two parties: an Identity Provider (IdP) which authenticates the user, and a Service Provider (SP) which authorises user actions.   
  * AWS IdPs:  
- AWS Single Sign-On (SSO) allows users to access multiple AWS accounts with an organisation using the same set of credentials.  
- AWS IAM lets you configure different OpenID or SAML providers for each account.  
- AWS Cognito enables auth. to apps using SAML 2.0 or web identity federation. 

 

* Cross-Account Access using IAM  
  * Allows services within one AWS account (trusted account) to access resources within another account (trusting account) through the use of IAM roles.   
  * Steps involved  
1. Create a new role from within the trusting account  
2. Specify the permissions within this newly created role for the trusted resources  
3. Switch to the trusted account, and allow whatever service to assume this role.  

Amazon Cognito

* A service which implements authentication with 3rd party integration and user management. It also allows you to federate identities from your on-premise active directory service.    
* User pools  
- manage creation and maintenance (signup and login) a directory of users for an app  
- alongside defining custom requirements and fields, this service allows for MFA and account recovery for users within the pool.  
- Users authenticate themselves via credentials or 3rd party, then Cognitor issues a token or a challenge (to help screening for bots), then user responds, and so on.    
* Identity pools  
- Also known as Federated Identities, these help to provide temporary access to AWS credentials for your users or guests. They can work alongside User pools.   
- Identities can be authenticated or unauthenticated, the latter can act as a “guest pass” and each identity has a role associated with it.   
- Users authenticate via Cognito User Pools, and a Cognito user pool (CUP) token is generated. From here, an AWS STS token is generated and returned to the user.  
* AWS Cognito can be integrated within apps built with AWS Amplify, a service that helps with the creation of scalable front-end applications.  
* AWS Cognito Sync helps with synchronising user data across applications and devices. Data records are grouped into Data Sets (dictionaries of max 1MB of size) which are associated with an Identity Pool.

AWS KMS

* A managed service used to create and manage encryption keys used within your AWS infrastructure.  
* Note that KMS performs encryption only at rest, and not in transit, for that SSL is best.   
* Different types of keys include:  
1. AWS KMS Keys \- used to encrypt and decrypt data or generate encryption keys used to encrypt data outside of KMS. These generated keys can be symmetric for encryption within AWS, or asymmetric for encryption outside of AWS.   
2. Customer Managed Keys \- created, managed, and controlled by customers  
3. AWS Owned Keys \- managed by AWS  
4. AWS Managed Keys \- automatically created and managed by integrated AWS services, and perform the same functions as customer-managed keys.    
5. Data Keys \- generated within KMS, and used to encrypt data outside of KMS  
6. HMAC Keys \- create and verify HMAC codes  
* Permissions and Key Policies  
  * Policies are a security feature within KMS that allows you to manage access to a key  
  * Grants are a resource-based temporary policy which allows you to provide access to a key to another principal, such as another user within your AWS account.   
  * Access to a KMS key can be achieved via (1) key policies, (2) IAM policies, (3) grants.

AWS Certificates Manager

* Digital certificates allow us to trust the validity of the entity we are communicating with over HTTPS  
* Certificates are usually associated with a public encryption key, and are issued by a Trusted Certificate Authority (CA), which can be public or private.  
* This AWS service allows us to request SSL/TLS certificates from a trusted public CA, which in turn can be used to authenticate with services such as ELBs, API Gateway, and Cloudfront.  
* This service can also be used to set up a private certificate authority, and it supports automatic renewal of certificates.  
  * To set up a private CA, you need a root CA and a series of subordinate CAs.

AWS WAF

* A web application firewall service that protects apps from common web attack patterns.  
* It interacts with API Gateway, Cloudfront distributions, ALBs, and AppSync GraphQL APIs.  
* The main components of WAF are:  
  * Rules \- made of actions which are triggered when a request matches a statement.  
  * Rule Groups \- a collection of rules that can be applied to a different web ACLs  
  * Web ACLs \- determines which web requests are safe and which aren’t using Rules. ACLs have an associated write capacity as WCUs, which is used up by rules and rule groups. 

AWS Security Token Service (STS)

* A service which enables to request temporary, limited-privilege credentials for IAM users or federated 

## **Application Integration**

* EventBridge   
  * An event coordinator service which takes in event messages and routes them to other services. It is the only AWS event-based service that integrates with other 3rd party support such as Auth0.  
  * The **event bus** is the initial arrival point for all messages coming in EventBridge. Each account comes with a default event bus, although more can be created. Each bus can have up to 100 **rules** associated with it.  
  * Rules allow you to define event filters against the event bus. You need to define a **target** for the rule to forward the filtered message to.   
  * Cross-account events allow you to send events across accounts.   
  * **Archives** in EventBridge allow you to store events and replay them, useful for disaster recovery for example  
  * **Schemas** allow you to define the expected fields contained in an event’s payload. EventBridge comes with a **Schema Registry** with pre-defined schemas or schema discovery for new event schemas.  
* AWS Step Functions  
  * Lambda functions on its own have a limited running time of 15 minutes.   
  * Step functions provide a state machine service, which can be implemented as a composition of Lambdas.  
  * Workflows are defined in Amazon State Language, written in JSON.  
  * State machines can be nested, hence a child state machine that runs within a parent one, good for repeatable patterns.   
  * There are 8 states in which the machine can be at any time:  
1. Pass \- a debugging state which lets you pass input straight to output   
2. Task \- define a resource to run and a timeout period  
3. Choice \- conditional branching   
4. Wait \- pause the machine until a specific event or timestamp  
5. Success \- termination of the state machine in a successful fashion  
6. Fail \- termination in a failed fashion, must include an error message and a cause  
7. Parallel \- executes branches in parallel and waits for their termination before moving on.  
8. Map \- iterate through a list of items and perform tasks on them, also supports concurrency   
* Decoupling Apps using Queues  
  * Amazon SQS allows to decouple applications by keeping messages in memory until a consumer begins to read them. It implements a one-to-one messaging model.   
  * A Producer puts messages in the queue, a Consumer polls the queue.   
- When a message is picked up by a consumer, a **visibility timeout (VT)** of 30 seconds (min 0 sec. max 12 hours) is set by default on the message (or the entire queue) to avoid it being read by multiple consumers.  
- Once the consumer finishes processing the message it issues a delete call to remove it from the queue.   
- If the delete message is not issued before the end of the VT then the message becomes available to other consumers.  
  * Consumers can use short polling or long polling:  
- **Short polling** is when the consumer sends a request to the queue for messages and a response containing either a message to process or nothing is returned.  
- **Long polling** is when the queue waits for a pre-configured number of seconds before returning a response, or when a new message is available, whichever takes the least time.   
  * Message size  
- Minimum is 1KB, while max is 256KB.   
- For larger messages, either use the SQS Extended Client library or send a message with a link to an S3 object, which can be used to retrieve the message payload.   
  * Message order  
- SQS does not guarantee message ordering and guarantees at least once delivery of messages  
- There can be a maximum of 120,000 in-flight (received, not yet deleted) messages in a queue  
- **FIFO** queues provide message order guarantees and exactly-once message delivery.  
  * Dead-letter queues can be useful to capture messages which cannot be processed, and therefore deleted from the queue. Usually occurs when the message is corrupted. SNS and lambda should be used for quick monitoring and handling of messages in a Dead letter queue.    
* Notifications with SNS  
  * Supports one-to-many messaging model, where one **publisher** publishes messages to a topic, and **subscribers** subscribe to the topic and read the messages.   
  * Unlike queues, topics do not store messages. Once a message is published, it is sent to all subscribers.  
  * The fan-out messaging pattern can be implemented by having multiple SQS queues subscribe to an SNS topic.   
- Using FIFO SNS topics and FIFO SQS queues achieves idempotency at the messaging layer.   
  * SNS messages  
- Can be up to 256KB in size, and messages are broken into 64KB chunks.   
- The SNS Extended Client library can be used to publish messages up to 2GB in size, leveraging S3 to store payload.   
  * Message filtering allows subscribers to use a filtering policy to only receive certain messages from a subscribed topic.   
  * An SNS Delivery Policy can be used to control the retry pattern, and when the retry policy is exhausted, the message is moved to a dead letter queue.  
* AWS AppSync  
  * Fully-managed service to develop serverless GraphQL and pub/sub APIs.  
  * Integrates with IAM roles and Cognito to support authentication and with Cloudwatch and X-Ray for observability.   
  * Supports **resolvers**, which allow you to write custom JavaScript to implement business logic to access a data source.   
  * Can also use Lambda data source as a proxy to your data source. 