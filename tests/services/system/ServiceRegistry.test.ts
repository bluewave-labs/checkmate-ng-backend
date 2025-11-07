import ServiceRegistry from "@/services/system/ServiceRegistry";

describe("ServiceRegistry", () => {
  describe("Singleton Behavior", () => {
    it("should return the same instance", () => {
      const instance1 = ServiceRegistry.instance;
      const instance2 = ServiceRegistry.instance;
      expect(instance1).toBe(instance2);
    });

    it("should create a new instance if _instance is undefined", () => {
      (ServiceRegistry as any)._instance = undefined;
      const instance = ServiceRegistry.instance;
      expect(instance).toBeInstanceOf(ServiceRegistry);
    });

    it("should not expose _instance publicly", () => {
      const instance = ServiceRegistry.instance;
      expect("_instance" in instance).toBe(false);
    });
  });

  describe("register and get", () => {
    it("should register and retrieve a service", () => {
      const serviceName = "TestService";
      const serviceInstance = { name: "TestServiceInstance" };
      ServiceRegistry.register(serviceName, serviceInstance);
      const retrievedService = ServiceRegistry.get(serviceName);
      expect(retrievedService).toBe(serviceInstance);
    });

    it("should throw an error when retrieving an unregistered service", () => {
      const unregisteredServiceName = "UnregisteredService";
      expect(() => {
        ServiceRegistry.get(unregisteredServiceName);
      }).toThrow("Service UnregisteredService is not registered");
    });
  });

  describe("get serviceName", () => {
    it("should return the correct service name", () => {
      const instance = ServiceRegistry.instance;
      expect(instance.serviceName).toBe("ServiceRegistry");
    });
  });

  describe("listServices", () => {
    it("should list all registered services", () => {
      const serviceName1 = "ServiceOne";
      const serviceName2 = "ServiceTwo";
      const serviceInstance1 = { name: "ServiceOneInstance" };
      const serviceInstance2 = { name: "ServiceTwoInstance" };
      ServiceRegistry.register(serviceName1, serviceInstance1);
      ServiceRegistry.register(serviceName2, serviceInstance2);
      const services = ServiceRegistry.listServices();
      expect(services).toContain(serviceName1);
      expect(services).toContain(serviceName2);
    });
  });

  describe("ServiceRegistry static get", () => {
    beforeEach(() => {
      (ServiceRegistry as any)._instance = undefined;
    });

    it("throws if ServiceRegistry is not initialized", () => {
      (ServiceRegistry as any)._instance = undefined;
      expect(() => ServiceRegistry.get("foo")).toThrow(
        "Service foo is not registered"
      );
    });

    it("throws if service is not registered", () => {
      const instance = ServiceRegistry.instance;
      expect(() => ServiceRegistry.get("nonexistent")).toThrow(
        "Service nonexistent is not registered"
      );
    });

    it("returns the registered service", () => {
      const service = { foo: "bar" };
      ServiceRegistry.register("myService", service);
      expect(ServiceRegistry.get("myService")).toBe(service);
    });

    it("throws if ServiceRegistry is not initialized", () => {
      // Remove the getter so instance stays undefined
      Object.defineProperty(ServiceRegistry, "instance", {
        get: () => undefined,
        configurable: true,
      });
      expect(() => ServiceRegistry.get("foo")).toThrow(
        "ServiceRegistry not initialized"
      );
      // Restore the getter after test
      delete (ServiceRegistry as any).instance;
    });
  });

  describe("ServiceRegistry static register", () => {
    beforeEach(() => {
      (ServiceRegistry as any)._instance = undefined;
    });

    it("throws if ServiceRegistry is not initialized", () => {
      Object.defineProperty(ServiceRegistry, "instance", {
        get: () => undefined,
        configurable: true,
      });
      expect(() => ServiceRegistry.register("foo", {})).toThrow(
        "ServiceRegistry not initialized"
      );
      delete (ServiceRegistry as any).instance;
    });
  });

  describe("ServiceRegistry static listServices", () => {
    beforeEach(() => {
      (ServiceRegistry as any)._instance = undefined;
    });

    it("throws if ServiceRegistry is not initialized", () => {
      // Remove the getter so instance stays undefined
      Object.defineProperty(ServiceRegistry, "instance", {
        get: () => undefined,
        configurable: true,
      });
      expect(() => ServiceRegistry.listServices()).toThrow(
        "ServiceRegistry not initialized"
      );
      // Restore the getter after test
      delete (ServiceRegistry as any).instance;
    });
  });
});
