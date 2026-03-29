Sandi Metz
The rules
There are four lights.
There are four rules.

Here are the rules:

    Classes can be no longer than one hundred lines of code.
    Methods can be no longer than five lines of code.
    Pass no more than four parameters into a method. Hash options are parameters.
    Controllers can instantiate only one object. Therefore, views can only know about one instance variable and views should only send messages to that object (@object.collaborator.value is not allowed).

When to break these rules

Paraphrasing Sandi, “You should break these rules only if you have a good reason or your pair lets you.” Your pair or the person reviewing your code are the people who you should ask.

Think of this as rule zero. It is immutable.
100-line classes

Despite the large number of private methods we wrote, keeping classes short proved easy. It forced us to consider what the single responsibility of our class was, and what should be extracted.

This applied to specs as well. In one case, we found a spec file ran over the limit which helped us realize we were testing too many features. We split the file into a few, more focused, feature specs.

That made us realize that git diffs wouldn’t necessarily show us when we exceed 100 lines.
Five lines per method

Limiting methods to five lines per method is the most interesting rule.

We agreed if, else, and end are all lines. In an if block with two branches, each branch could only be one line.

For example:

def validate_actor
  if actor_type == 'Group'
    user_must_belong_to_group
  elsif actor_type == 'User'
    user_must_be_the_same_as_actor
  end
end

Five lines ensured that we never use else with elsif.

Having only one line per branch urged us to use well-named private methods to get work done. Private methods are great documentation. They need very clear names, which forced us to think about the content of the code we were extracting.
Four method arguments

The four method arguments rule was particularly challenging in Rails, and particularly in the views.

View helpers such as link_to or form_for can end up requiring many parameters to work correctly. While we put some effort into not passing too many arguments, we fell back to Rule 0 and left the parameters if we couldn’t find a better way to do it.
Only instantiate one object in the controller

This rule raised the most eyebrows before we started the experiment. Often, we needed more than one type of thing on a page. For example, a homepage needed both an activity feed and a notification counter.

We solved this using the Facade Pattern. It looked like this:

app/facades/dashboard.rb:

class Dashboard
  def initialize(user)
    @user = user
  end

  def new_status
    @new_status ||= Status.new
  end

  def statuses
    Status.for(user)
  end

  def notifications
    @notifications ||= user.notifications
  end

  private

  attr_reader :user
end

app/controllers/dashboards_controller.rb:

class DashboardsController < ApplicationController
  before_filter :authorize

  def show
    @dashboard = Dashboard.new(current_user)
  end
end

app/views/dashboards/show.html.erb:

<%= render 'profile' %>
<%= render 'groups', groups: @dashboard.group %>

<%= render 'statuses/form', status: @dashboard.new_status %>
<%= render 'statuses', statuses: @dashboard.statuses %>

The Dashboard class provided a common interface for locating the user’s collaborator objects and we passed the dashboard’s state to view partials.

We didn’t count instance variables in controller memoizations toward the limit. We used a convention of prefixing unused variables with an underscore to make it clear what is meant to be used in a view:

def calculate
  @_result_of_expensive_calculation ||= SuperCalculator.get_started(thing)
end

----------- onion-architecture 

    Domain-driven design (DDD) is an approach to developing software for complex needs by deeply connecting the implementation to an evolving model of the core business concepts.

The domain is a sphere of knowledge. It refers to the business knowledge that our software is trying to model. Domain-Driven Design centres on the domain model that has a rich understanding of the processes and rules of a domain. Onion architecture implements this concept and dramatically increases code quality, reduces complexity and enables evolutionary enterprise systems.
Onion Architecture illustrating different layers. Domain Model at the centre, enclosed by Domain Services. Domain Services enclosed by Application services and then Infrastructure Services. Application enclosing all the layers. Observability services for monitoring the application
Onion Architecture
Why Onion Architecture?

Domain entities are the core and centre part. Onion architecture is built on a domain model in which layers are connected through interfaces. The idea is to keep external dependencies as far outward as possible where domain entities and business rules form the core part of the architecture.

    It provides flexible, sustainable and portable architecture.
    Layers are not tightly coupled and have a separation of concerns.
    It provides better maintainability as all the code depends on deeper layers or the centre.
    Improves overall code testability as unit tests can be created for separate layers without impacting other modules.
    Frameworks/technologies can be easily changed without impacting the core domain. e.g. RabbitMQ can be replaced by ActiveMQ, SQL can be replaced by MongoDB

Principles

Onion Architecture is comprised of multiple concentric layers interfacing with each other towards the core that represents the domain. It is based on the inversion of control principle. The architecture does not focus on underlying technology or frameworks but the actual domain models. It is based on the following principles.
Dependency

The circles represent different layers of responsibility. In general, the deeper we dive, the closer we get to the domain and business rules. The outer circles represent mechanisms and the inner circles represent core domain logic. The outer layers depend on inner layers and the inner layers are completely unaware of outer circles. Classes, methods, variables, and source code in general belonging to the outer circle depends on the inner circle but not vice versa.

Data formats/structures may vary from layers. Outer layer data formats should not be used by inner layers. E.g. Data formats used in an API can vary from those used in a DB for persistence. Data flow can use data transfer objects. Whenever data crosses layers/boundaries, it should be in a form that is convenient for that layer. E.g. API’s can have DTO’s, DB layer can have Entity Objects depending on how objects stored in a database vary from the domain model.
Data encapsulation

Each layer/circle encapsulates or hides internal implementation details and exposes an interface to the outer layer. All layers also need to provide information that is conveniently consumed by inner layers. The goal is to minimize coupling between layers and maximize coupling within a vertical slice across layers. We define abstract interfaces at deeper layers and provide their concrete implementation at the outermost layer. This ensures we focus on the domain model without worrying too much about implementation details. We can also use dependency injection frameworks, like Spring, to connect interfaces with implementation at runtime. E.g. Repositories used in the domain and external services used in Application Services are implemented at the infrastructure layer.
Concentric circles depicting an external service interface exposed to the Application layer and implemented at the Infrastructure layer. Also shows a Repository interface exposed to Domain Model and implemented at Infrastructure layer.
Data Encapsulation in Onion Architecture
Separation of concerns

Application is divided into layers where each layer has a set of responsibilities and addresses separate concerns. Each layer acts as modules/package/namespace within the application.
Coupling

Low coupling in which one module interacts with another module and does not need to be concerned with the other module’s internals. All the internal layers need not be concerned about internal implementation of external layers.
Onion Architecture Layers

Let’s understand different layers of the architecture and their responsibilities with an order creation use case. When receiving a create order request, we would like to validate the order, save the order in the database, update inventory for all order items, debit order amount and lastly send a notification to the customer about order completion.
Press enter or click to view image in full size
Package Diagram Illustrating Dependency across Layers. Application Services depends on Domain Services. Infrastructure services depending on Domain and Application Services.
Package Diagram Illustrating Dependency across Layers
Press enter or click to view image in full size
Example Interactions Across Different Layers. Infrastructure Services like GRPC Server calling Application Services for Creating Order and orchestrating order creation across different Domain Services. Domain Services could be storing information in database, providing Interface for Inventory or Notification Service.
Domain Model/Entities

Domain Entities are the fundamental building block of Domain-Driven Design and they’re used to model concepts of your Ubiquitous Language in code. Entities are Domain concepts that have a unique identity in the problem domain. Domain entities encapsulate attributes and entity behaviour. It is supposed to be independent of specific technologies like databases or web APIs. E.g. In the Orders domain. Order is an entity and has attributes like OrderId, Address, UserInfo, OrderItems, PricingInfo and behaviour like AddOrderItems, GetPricingInfo, ValidateOrder, etc.
Order Entity Class Example illustrating Entity’s Data and Behaviour
Order Entity Class
Domain services

Domain services are responsible for holding domain logic and business rules. All the business logic should be implemented as a part of domain services. Domain services are orchestrated by application services to serve business use-case. They are NOT typically CRUD services and are usually standalone services. Domain services are responsible for complex business rules like computing pricing and tax information when processing order, Order repository interface for saving and updating order, Inventory Interface for updating information about items purchased, etc.
Get Ritesh Kapoor’s stories in your inbox

Join Medium for free to get updates from this writer.

It consists of algorithms that are essential to its purpose and implement the use cases that are the heart of the application.
Application services

Application services also referred to as “Use Cases”, are services responsible for just orchestrating steps for requests and should not have any business logic. Application Services interact with other services to fulfil the client’s request. Let’s consider the use case to create an order with a list of items. We first need to calculate the price including tax computation/discounts, etc., save order items and send order confirmation notification to the customer. Pricing computation should be part of the domain service, but orchestration involving pricing computation, checking availability, saving order and notifying users should be part of the application service. The application services can be only invoked by Infrastructure services.
Infrastructure services

Infrastructure services also referred to as Infrastructure adapters are the outermost layer in onion architecture. These services are responsible for interacting with the external world and do not solve any domain problem. These services just communicate with external resources and don’t have any logic. E.g. External notification Service, GRPC Server endpoint, Kafka event stream adapter, database adapters.
Observability services

Observability services are responsible for monitoring the application. These services help perform tasks like :

    Data collection (metrics, logs, traces) — use mainly libraries/sidecars to collect various data during code execution.
    Data storage — use tools that enable central storage of the collected data (sorting, indexing, etc.)
    Visualisation — use tools that allow you to visualise the collected data.

Few examples include Splunk, ELK, Grafana, Graphite, Datadog.
Testing Strategy

Different layers of onion architecture have a different set of responsibilities and accordingly, there are different testing strategies. The testing pyramid is a great framework that lays out the different types of tests. Business rules that belong to the domain model, domain services and application services should be tested via Unit Testing. As we move to the outer layer, it makes more sense to have integration tests in infrastructure services. For our application End to End testing and BDD are the most appropriate testing strategies.
Concentric circles labeling testing practices by layer. Unit Testing for Domain Model, Domain Services and Application Services. Integration Testing for Infrastructure Services and End to End Testing for Application.
Testing Strategy For Different Layers
Microservices

Onion architecture is also applicable to microservices when viewing each microservice in isolation. Each microservice has its own model, its own use cases and defines its own external interfaces for retrieving or modifying the data. These interfaces can be implemented with an adapter that connects to another microservice by exposing HTTP Rest, GRPC, Thrift Endpoints, etc. It’s a good fit for microservices, where data access layer not only comprises database, but also for example an http client, to get data from another microservice, or even from an external system.
Application Structure & Layers
Application Structure & Layers covering how layers are mapped to modules and their dependency between each other. It also describes what testing strategy to be used for different layers.
Modularisation vs Packaging

There are two ways to organise application source code:

    Either, we can have all the packages in a single module/project or
    Divide the application into different modules/projects each responsible for a layer in onion architecture.

It greatly depends on the complexity of the application and the size of the project to divide source code into multiple modules. In a microservice architecture, modularisation may or may not make sense depending upon the complexity and use-case.
Frameworks, Clients and Drivers

The infrastructure layer composes frameworks for web or servers, clients for databases, queues or external services. It is responsible for configuring and stitching all the external services and frameworks together. Onion architecture provides decoupling so that it becomes easier to swap technologies at any point in time.
Do We Need Every Layer?

Organising our application in layers helps in achieving separation of concerns. But do we need all the layers? Maybe, maybe not. It depends on the use cases and the complexity of the application. It is also possible to create more layers of abstractions depending on application needs. E.g. for smaller applications that don’t have a lot of business logic, it might not make sense to have domain services. Regardless of layers, dependencies should always be from outer layers to inner layers.
Conclusion

Onion architecture might seem hard in beginning but is widely accepted in the industry. It is a powerful architecture and enables easy evolution of software. By separating the application into layers, the system becomes more testable, maintainable and portable. It helps easy adoption of new frameworks/technologies when old frameworks become obsolete. Similar to other architectural styles like Hexagonal, Layered, Clean Architecture, etc. it provides a solution for common problems.

https://medium.com/expedia-group-tech/onion-architecture-deed8a554423

----------- hexagonal-architecture 

Memahami Arsitektur Hexagonal: Cara Baru Membangun Aplikasi yang Fleksibel dan Scalable
Fauzi Fadhlurrohman
Fauzi Fadhlurrohman
7 min read
·
Jan 17, 2025
Press enter or click to view image in full size
Hexagonal. Source from : github

Dalam dunia pengembangan perangkat lunak, istilah architecture sering banget kita dengar, apalagi kalau udah ngomongin tentang bagaimana aplikasi dibuat. Salah satu arsitektur yang belakangan makin sering dibahas adalah arsitektur hexagonal, atau sering juga disebut Ports and Adapters Architecture. Kalau kamu lagi cari pendekatan yang bikin aplikasi lebih fleksibel, scalable, dan mudah diuji, arsitektur ini layak kamu eksplor.
Apa Itu Arsitektur Hexagonal?

Sesuai namanya, arsitektur ini digambarkan sebagai bentuk segi enam (hexagon). Tapi, jangan terlalu terpaku sama bentuknya, ya. Filosofi utama dari arsitektur hexagonal adalah memisahkan logika bisnis (core business logic) dari dependensi luar seperti database, API eksternal, atau antarmuka pengguna (user interface).
Get Fauzi Fadhlurrohman’s stories in your inbox

Join Medium for free to get updates from this writer.

Kenapa penting?
Karena dengan memisahkan keduanya, aplikasi jadi lebih fleksibel buat berubah. Misalnya, kamu mau ganti database dari PostgreSQL ke MongoDB, atau mau pindah dari REST API ke GraphQL. Dengan arsitektur ini, perubahan semacam itu nggak bakal terlalu ribet.
Komponen Utama dalam Arsitektur Hexagonal

Arsitektur hexagonal punya tiga komponen utama:

    Core (Domain Logic)
    Di sini adalah inti aplikasi kamu. Semua aturan bisnis, logika, dan entitas utama hidup di sini. Bagian ini murni dan bebas dari detail implementasi luar.
    Ports
    Ports adalah antarmuka yang mendefinisikan bagaimana bagian luar (adapters) berinteraksi dengan logika inti. Ini seperti pintu gerbang yang memungkinkan core tetap terisolasi dari dunia luar.
    Adapters
    Adapters adalah implementasi nyata dari antarmuka yang didefinisikan di ports. Contohnya, adapter untuk database, REST API, atau interface CLI.

Contoh Sederhana

Bayangkan kamu bikin aplikasi untuk mengelola tugas harian. Core kamu mungkin punya logika seperti ini:

    Tambahkan tugas.
    Tandai tugas selesai.
    Hapus tugas.

Port-nya mungkin berupa antarmuka TaskRepository yang mendefinisikan cara menyimpan tugas. Sementara itu, adapter-nya bisa berupa implementasi konkret untuk menyimpan tugas di PostgreSQL, file lokal, atau bahkan di memori sementara.
Apa Keuntungannya?

    Fleksibilitas Tinggi
    Karena core nggak bergantung langsung pada hal-hal eksternal, kamu bisa ganti teknologi kapan aja tanpa perlu banyak perubahan di logika bisnis.
    Mudah Diuji
    Dengan memisahkan core dan dependensi, pengujian jadi lebih gampang. Kamu cukup buat mock atau stub untuk dependensi eksternal.
    Scalability
    Struktur yang terorganisir ini bikin aplikasi lebih siap untuk bertumbuh seiring kebutuhan bisnis.
    Konsistensi dalam Kode
    Dengan membagi tanggung jawab yang jelas, kode jadi lebih mudah dipahami, terutama untuk tim yang besar.

Kapan Harus Menggunakan Arsitektur Hexagonal?

Arsitektur ini nggak selalu cocok untuk semua proyek. Kalau kamu bikin aplikasi kecil yang nggak rumit, mungkin terlalu berlebihan. Tapi kalau kamu:

    Punya aplikasi yang kompleks,
    Ingin tetap fleksibel dengan perubahan teknologi,
    Butuh struktur yang mudah dirawat,
    Arsitektur hexagonal bisa jadi solusi yang tepat.

Studi Kasus: Membangun Aplikasi Pengelolaan Tugas dengan Arsitektur Hexagonal

Untuk lebih memahami bagaimana arsitektur hexagonal bekerja, mari kita bahas contoh studi kasus sederhana: aplikasi pengelolaan tugas (To-Do App). Aplikasi ini harus:

    Menambahkan tugas baru.
    Menandai tugas sebagai selesai.
    Menghapus tugas dari daftar.
    Menyimpan data ke database atau layanan eksternal.

1. Merancang Core (Domain Logic)

Domain logic adalah bagian paling inti dari aplikasi. Dalam kasus ini, kita akan membuat logika untuk mengelola tugas.

    Entitas:

public class Task {
    private String id;
    private String description;
    private boolean isCompleted;

    // Constructor
    public Task(String id, String description) {
        this.id = id;
        this.description = description;
        this.isCompleted = false;
    }

    // Methods
    public void markAsCompleted() {
        this.isCompleted = true;
    }

    public void updateDescription(String description) {
        this.description = description;
    }

    public boolean isCompleted() {
        return isCompleted;
    }

}

    Port:
    Port dalam arsitektur hexagonal biasanya berupa antarmuka yang mendefinisikan kontrak bagaimana logika inti berinteraksi dengan sistem eksternal.

public interface TaskRepository {
    void save(Task task);
    Task findById(String id);
    List<Task> findAll();
    void delete(String id);
}

    Service:
    Core aplikasi menggunakan port untuk menjalankan logika bisnisnya.

public class TaskService {
    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public void addTask(String id, String description) {
        Task task = new Task(id, description);
        taskRepository.save(task);
    }

    public void completeTask(String id) {
        Task task = taskRepository.findById(id);
        task.markAsCompleted();
        taskRepository.save(task);
    }

    public void deleteTask(String id) {
        taskRepository.delete(id);
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }
}

2. Membangun Adapter untuk Database

Sekarang, kita butuh implementasi nyata untuk menyimpan data ke database. Misalnya, kita akan menggunakan PostgreSQL.

public class PostgreSQLTaskRepository implements TaskRepository {
    private final DataSource dataSource;

    public PostgreSQLTaskRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void save(Task task) {
        // Logic to save task to PostgreSQL
    }

    @Override
    public Task findById(String id) {
        // Logic to fetch task by ID from PostgreSQL
        return null;
    }

    @Override
    public List<Task> findAll() {
        // Logic to fetch all tasks
        return null;
    }

    @Override
    public void delete(String id) {
        // Logic to delete task by ID
    }
}

Adapter ini implementasi nyata dari TaskRepository dan menggunakan PostgreSQL sebagai media penyimpanan. Kalau suatu saat kamu ingin mengganti database ke MongoDB atau menyimpan di cloud seperti Firebase, kamu cukup membuat adapter baru tanpa mengubah kode core.

3. Menambahkan Adapter untuk Antarmuka Pengguna

Misalnya, kita mau akses aplikasi ini lewat REST API. Adapter REST API akan menjadi penghubung antara pengguna dan core.

@RestController
@RequestMapping("/tasks")
public class TaskController {
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public ResponseEntity<Void> createTask(@RequestBody TaskRequest taskRequest) {
        taskService.addTask(taskRequest.getId(), taskRequest.getDescription());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Void> completeTask(@PathVariable String id) {
        taskService.completeTask(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable String id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }
}

4. Testing dan Skalabilitas

Karena logika bisnis (core) sudah dipisahkan dari adapter, kita bisa dengan mudah membuat pengujian unit tanpa melibatkan database sungguhan atau API. Misalnya, untuk menguji TaskService, kita cukup gunakan implementasi mock dari TaskRepository.

@Test
public void testAddTask() {
    TaskRepository mockRepository = mock(TaskRepository.class);
    TaskService taskService = new TaskService(mockRepository);

    taskService.addTask("1", "Learn Hexagonal Architecture");
    
    verify(mockRepository).save(any(Task.class));
}

Manfaat di Dunia Nyata

    Mudah Beradaptasi dengan Perubahan Teknologi:
    Ganti database? Tambah antarmuka CLI? Kamu cukup menambahkan adapter baru tanpa mengganggu logika bisnis.
    Peningkatan Kecepatan Pengembangan:
    Tim yang berbeda (backend, frontend, database) bisa bekerja paralel tanpa banyak konflik.
    Kualitas Kode Lebih Baik:
    Struktur yang modular memudahkan pengembang baru memahami sistem, mempercepat pengembangan, dan mengurangi bug.

Hubungan Antara Hexagonal Architecture dan Clean Code

Arsitektur hexagonal dan prinsip clean code memiliki keterkaitan yang erat, karena keduanya bertujuan menciptakan perangkat lunak yang mudah dipahami, fleksibel, terstruktur, dan mudah dirawat. Mari kita lihat bagaimana keduanya saling berhubungan.
1. Pemisahan Tanggung Jawab (Separation of Concerns)

    Clean Code: Salah satu prinsip utama clean code adalah Single Responsibility Principle (SRP), yang menyatakan bahwa setiap kelas atau fungsi harus memiliki satu alasan untuk berubah. Artinya, kode harus fokus pada satu tugas tertentu.
    Hexagonal Architecture: Dalam arsitektur hexagonal, pemisahan tanggung jawab sangat ditekankan melalui pembagian antara:
    Core (Domain Logic): Fokus pada logika bisnis aplikasi.
    Ports: Mendefinisikan antarmuka untuk interaksi eksternal.
    Adapters: Implementasi nyata dari interaksi eksternal seperti database atau API.

Contoh:
Dalam aplikasi dengan arsitektur hexagonal, logika bisnis tidak akan mengetahui bagaimana data disimpan di database, sehingga tanggung jawab masing-masing bagian tetap jelas.
2. Keterbacaan dan Kejelasan Kode

    Clean Code: Kode yang bersih harus mudah dibaca, dimengerti, dan dipahami, baik oleh pengembang baru maupun yang sudah lama terlibat di proyek.
    Hexagonal Architecture: Dengan memisahkan logika bisnis, antarmuka, dan implementasi eksternal, kode menjadi lebih terorganisir. Struktur ini secara alami meningkatkan keterbacaan, karena setiap bagian kode berada di tempat yang logis dan sesuai tanggung jawabnya.

Contoh:
Kode untuk menyimpan data ke database hanya ada di adapter database, sedangkan kode untuk menghitung total penjualan ada di domain logic. Keduanya tidak tercampur.
3. Pengujian yang Mudah

    Clean Code: Prinsip clean code menyarankan pengujian otomatis (automated testing) untuk memastikan bahwa kode tetap berfungsi dengan benar saat dilakukan perubahan.
    Hexagonal Architecture: Arsitektur ini mendukung pengujian yang lebih mudah karena core tidak bergantung pada implementasi eksternal.
    Kamu bisa membuat mock atau stub dari adapter tanpa perlu database atau API nyata untuk menguji logika bisnis.
    Hal ini sesuai dengan prinsip clean code yang mendorong pengujian unit secara menyeluruh.

4. Fleksibilitas dan Kemudahan Perubahan

    Clean Code: Kode yang bersih harus mudah diubah tanpa menyebabkan masalah di bagian lain aplikasi. Ini sejalan dengan prinsip Open-Closed Principle (OCP), di mana kode harus terbuka untuk diperluas tapi tertutup untuk modifikasi.
    Hexagonal Architecture: Dengan membagi aplikasi ke dalam core, ports, dan adapters, kamu bisa mengganti atau menambahkan fitur baru (misalnya, ganti database atau API) tanpa mengubah logika bisnis inti.

Contoh:
Jika kamu ingin mengganti database dari PostgreSQL ke MongoDB, kamu cukup membuat adapter baru tanpa menyentuh domain logic atau service yang sudah ada.
5. Konsistensi dalam Struktur Kode

    Clean Code: Kode yang bersih memiliki struktur yang konsisten, sehingga mudah dimengerti dan digunakan kembali.
    Hexagonal Architecture: Arsitektur ini menawarkan pola yang jelas dan terstandarisasi. Setiap bagian aplikasi memiliki tempatnya masing-masing: logika bisnis di core, antarmuka di ports, dan implementasi di adapters.

6. Modularitas dan Reusabilitas

    Clean Code: Mendorong pembuatan kode yang modular dan dapat digunakan kembali. Ini mencakup prinsip seperti DRY (Don’t Repeat Yourself).
    Hexagonal Architecture: Karena struktur modular, kamu bisa menggunakan kembali komponen seperti domain logic di berbagai tempat tanpa tergantung pada detail implementasi tertentu.

Contoh:
Domain logic untuk menghitung total penjualan bisa digunakan di aplikasi REST API, aplikasi mobile, atau bahkan aplikasi desktop hanya dengan menambahkan adapter yang sesuai.
Kesimpulan

Arsitektur hexagonal adalah implementasi konkret dari prinsip clean code dalam skala arsitektural. Dengan memisahkan tanggung jawab, menjaga keterbacaan kode, mendukung pengujian yang mudah, dan memastikan fleksibilitas, arsitektur ini membantu pengembang menerapkan clean code di proyek nyata.

Jika clean code adalah panduan untuk menulis kode yang rapi, arsitektur hexagonal adalah kerangka kerja yang membantu menerapkan prinsip-prinsip tersebut dalam desain perangkat lunak yang lebih besar. Menggunakan keduanya berarti kamu sedang membangun perangkat lunak yang tidak hanya bekerja dengan baik sekarang, tetapi juga mudah dirawat di masa depan.